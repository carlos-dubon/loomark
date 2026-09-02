import type { Browser } from "playwright-core"

import type { ArchiveFormat } from "@loomark/core/archive"

import { launchBrowser } from "@/lib/archives/browser"
import { captureBookmark } from "@/lib/archives/capture"
import {
  claimArchiveJobs,
  MAX_ATTEMPTS,
  releaseStaleJobs,
} from "@/lib/archives/queue"
import {
  archiveRelativePath,
  listStoredBookmarkIds,
  listStoredUserIds,
  removeBookmarkArchives,
  writeArchive,
} from "@/lib/archives/storage"
import { prisma } from "@/lib/prisma"

const POLL_MS = Number(process.env.ARCHIVE_POLL_MS ?? 5000)
const IDLE_MS = Number(process.env.ARCHIVE_IDLE_MS ?? 20000)
const BOOKMARKS_PER_CYCLE = Number(process.env.ARCHIVE_BATCH ?? 3)
const SWEEP_MS = 30 * 60_000

type Job = {
  id: string
  format: ArchiveFormat
  userId: string
  bookmarkId: string
  attempts: number
  bookmark: { url: string }
}

const log = (message: string) => console.log(`loomark archive: ${message}`)

const fail = (job: Job, error: string) =>
  prisma.archive.update({
    where: { id: job.id },
    data: {
      attempts: job.attempts + 1,
      error: error.slice(0, 500),
      status: job.attempts + 1 >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
    },
  })

const succeed = async (job: Job, data: Buffer) => {
  const path = archiveRelativePath(job.userId, job.bookmarkId, job.format)
  const bytes = await writeArchive(path, data)

  await prisma.archive.update({
    where: { id: job.id },
    data: {
      path,
      bytes,
      status: "READY",
      error: null,
      attempts: job.attempts + 1,
    },
  })
}

const runBookmark = async (browser: Browser, jobs: Job[]) => {
  const [first] = jobs
  const outcomes = await captureBookmark(
    browser,
    first.bookmark.url,
    jobs.map((job) => job.format)
  )

  for (const job of jobs) {
    const outcome = outcomes.find((item) => item.format === job.format)

    if (!outcome) {
      await fail(job, "Capture produced no result")

      continue
    }

    if ("error" in outcome) {
      await fail(job, outcome.error)

      continue
    }

    await succeed(job, outcome.data)
  }
}

const groupByBookmark = (jobs: Job[]) => {
  const groups = new Map<string, Job[]>()

  for (const job of jobs) {
    const existing = groups.get(job.bookmarkId)

    if (existing) {
      existing.push(job)
    } else {
      groups.set(job.bookmarkId, [job])
    }
  }

  return [...groups.values()]
}

const release = (jobs: Job[]) =>
  prisma.archive.updateMany({
    where: { id: { in: jobs.map((job) => job.id) } },
    data: { status: "PENDING" },
  })

const drain = async () => {
  await releaseStaleJobs()

  const jobs = (await claimArchiveJobs(BOOKMARKS_PER_CYCLE)) as Job[]

  if (jobs.length === 0) {
    return false
  }

  let browser: Browser

  try {
    browser = await launchBrowser()
  } catch (cause) {
    await release(jobs)

    throw cause
  }

  try {
    for (const group of groupByBookmark(jobs)) {
      try {
        await runBookmark(browser, group)
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "Archive failed"

        for (const job of group) {
          await fail(job, message)
        }
      }
    }
  } finally {
    await browser.close().catch(() => undefined)
  }

  return true
}

const sweepOrphans = async () => {
  for (const userId of await listStoredUserIds()) {
    const stored = await listStoredBookmarkIds(userId)

    if (stored.length === 0) {
      continue
    }

    const alive = await prisma.bookmark.findMany({
      where: { userId, id: { in: stored } },
      select: { id: true },
    })
    const keep = new Set(alive.map((bookmark) => bookmark.id))

    for (const bookmarkId of stored) {
      if (!keep.has(bookmarkId)) {
        await removeBookmarkArchives(userId, bookmarkId)
      }
    }
  }
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms).unref?.()
  })

let started = false

export const startArchiveWorker = () => {
  if (started || process.env.ARCHIVE_WORKER === "off") {
    return
  }

  started = true

  void (async () => {
    let sweptAt = 0
    let warned = false

    for (;;) {
      try {
        const worked = await drain()

        warned = false

        if (Date.now() - sweptAt > SWEEP_MS) {
          sweptAt = Date.now()
          await sweepOrphans()
        }

        await sleep(worked ? POLL_MS : IDLE_MS)
      } catch (cause) {
        if (!warned) {
          warned = true
          log(cause instanceof Error ? cause.message : "worker error")
        }

        await sleep(60000)
      }
    }
  })()
}
