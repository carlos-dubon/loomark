import {
  ARCHIVE_FORMATS,
  ARCHIVE_QUEUE_GROUPS,
  type ArchiveFormat,
  type ArchiveSettings,
  type ArchiveStage,
  type ArchiveStatus,
} from "@loomark/core/archive"
import type { ArchiveQueue, ArchiveQueueGroup } from "@loomark/core/types"

import { prisma } from "@/lib/prisma"
import { serializeArchive } from "@/lib/serialize"

export const MAX_ATTEMPTS = 3

const STALE_MINUTES = 15

const COLUMNS: Record<ArchiveFormat, keyof ArchiveColumns> = {
  SCREENSHOT: "archiveScreenshot",
  WEBPAGE: "archiveWebpage",
  PDF: "archivePdf",
  MARKDOWN: "archiveMarkdown",
}

type ArchiveColumns = {
  archiveScreenshot: boolean
  archiveWebpage: boolean
  archivePdf: boolean
  archiveMarkdown: boolean
}

export const toArchiveSettings = (columns: ArchiveColumns): ArchiveSettings =>
  Object.fromEntries(
    ARCHIVE_FORMATS.map((format) => [format, columns[COLUMNS[format]]])
  ) as ArchiveSettings

export const toArchiveColumns = (settings: Partial<ArchiveSettings>) =>
  Object.fromEntries(
    ARCHIVE_FORMATS.filter((format) => settings[format] !== undefined).map(
      (format) => [COLUMNS[format], settings[format]]
    )
  ) as Partial<ArchiveColumns>

export const getArchiveSettings = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      archiveScreenshot: true,
      archiveWebpage: true,
      archivePdf: true,
      archiveMarkdown: true,
    },
  })

  return user ? toArchiveSettings(user) : null
}

export const enabledFormatsFor = async (userId: string) => {
  const settings = await getArchiveSettings(userId)

  return settings
    ? ARCHIVE_FORMATS.filter((format) => settings[format])
    : ([] as ArchiveFormat[])
}

export const enqueueArchives = async (
  userId: string,
  bookmarkIds: string[],
  formats: ArchiveFormat[]
) => {
  if (bookmarkIds.length === 0 || formats.length === 0) {
    return 0
  }

  const { count } = await prisma.archive.createMany({
    data: bookmarkIds.flatMap((bookmarkId) =>
      formats.map((format) => ({ userId, bookmarkId, format }))
    ),
    skipDuplicates: true,
  })

  return count
}

export const enqueueForUser = async (userId: string, bookmarkIds: string[]) =>
  enqueueArchives(userId, bookmarkIds, await enabledFormatsFor(userId))

export const requeueArchives = async (
  userId: string,
  bookmarkId: string,
  formats: ArchiveFormat[]
) => {
  await enqueueArchives(userId, [bookmarkId], formats)

  const { count } = await prisma.archive.updateMany({
    where: { userId, bookmarkId, format: { in: formats } },
    data: { status: "PENDING", stage: null, attempts: 0, error: null },
  })

  return count
}

const activeScope = (
  userId: string,
  scope: { bookmarkId?: string; formats?: ArchiveFormat[] }
) => ({
  userId,
  status: { in: ["PENDING", "RUNNING"] satisfies ArchiveStatus[] },
  ...(scope.bookmarkId ? { bookmarkId: scope.bookmarkId } : {}),
  ...(scope.formats ? { format: { in: scope.formats } } : {}),
})

export const cancelArchives = async (
  userId: string,
  scope: { bookmarkId?: string; formats?: ArchiveFormat[] } = {}
) => {
  const jobs = await prisma.archive.findMany({
    where: activeScope(userId, scope),
    select: { id: true, path: true },
  })

  if (jobs.length === 0) {
    return 0
  }

  const restore = jobs.filter((job) => job.path !== null).map((job) => job.id)
  const drop = jobs.filter((job) => job.path === null).map((job) => job.id)

  await prisma.$transaction([
    prisma.archive.updateMany({
      where: { id: { in: restore } },
      data: { status: "READY", stage: null, error: null },
    }),
    prisma.archive.deleteMany({ where: { id: { in: drop } } }),
  ])

  return jobs.length
}

export const runningFormatsFor = async (bookmarkId: string) =>
  (
    await prisma.archive.findMany({
      where: { bookmarkId, status: "RUNNING" },
      select: { format: true },
    })
  ).map((job) => job.format)

export const setArchiveStage = (ids: string[], stage: ArchiveStage) =>
  prisma.archive.updateMany({
    where: { id: { in: ids }, status: "RUNNING" },
    data: { stage },
  })

const queuedBookmarkCount = async (userId: string) => {
  const [row] = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(DISTINCT "bookmarkId") AS count FROM "Archive"
    WHERE "userId" = ${userId} AND "status" IN ('PENDING', 'RUNNING')
  `

  return Number(row?.count ?? 0)
}

export const archiveQueueFor = async (
  userId: string
): Promise<ArchiveQueue> => {
  const where = activeScope(userId, {})

  const [pending, running, bookmarks, recent] = await Promise.all([
    prisma.archive.count({ where: { ...where, status: "PENDING" } }),
    prisma.archive.count({ where: { ...where, status: "RUNNING" } }),
    queuedBookmarkCount(userId),
    prisma.archive.groupBy({
      by: ["bookmarkId"],
      where,
      _min: { createdAt: true },
      orderBy: { _min: { createdAt: "asc" } },
      take: ARCHIVE_QUEUE_GROUPS,
    }),
  ])

  if (recent.length === 0) {
    return { groups: [], bookmarks: 0, pending, running }
  }

  const rows = await prisma.archive.findMany({
    where: {
      ...where,
      bookmarkId: { in: recent.map((row) => row.bookmarkId) },
    },
    orderBy: { createdAt: "asc" },
    include: {
      bookmark: { select: { title: true, url: true, faviconUrl: true } },
    },
  })

  const groups = new Map<string, ArchiveQueueGroup>()

  for (const row of rows) {
    const group = groups.get(row.bookmarkId) ?? {
      bookmarkId: row.bookmarkId,
      title: row.bookmark.title,
      url: row.bookmark.url,
      faviconUrl: row.bookmark.faviconUrl,
      queuedAt: row.createdAt.toISOString(),
      archives: [],
    }

    group.archives.push(serializeArchive(row))
    groups.set(row.bookmarkId, group)
  }

  const isRunning = (group: ArchiveQueueGroup) =>
    group.archives.some((archive) => archive.status === "RUNNING")

  return {
    groups: [...groups.values()].sort(
      (a, b) => Number(isRunning(b)) - Number(isRunning(a))
    ),
    bookmarks,
    pending,
    running,
  }
}

export const releaseStaleJobs = () =>
  prisma.archive.updateMany({
    where: {
      status: "RUNNING",
      updatedAt: { lt: new Date(Date.now() - STALE_MINUTES * 60_000) },
    },
    data: { status: "PENDING" },
  })

export const claimArchiveJobs = async (bookmarkLimit: number) => {
  const claimed = await prisma.$queryRaw<{ id: string }[]>`
    UPDATE "Archive" SET "status" = 'RUNNING', "updatedAt" = NOW()
    WHERE "bookmarkId" IN (
      SELECT "bookmarkId" FROM "Archive"
      WHERE "status" = 'PENDING' AND "attempts" < ${MAX_ATTEMPTS}
      GROUP BY "bookmarkId"
      ORDER BY MIN("createdAt") ASC
      LIMIT ${bookmarkLimit}
    )
    AND "status" = 'PENDING' AND "attempts" < ${MAX_ATTEMPTS}
    RETURNING "id"
  `

  if (claimed.length === 0) {
    return []
  }

  return prisma.archive.findMany({
    where: { id: { in: claimed.map((row) => row.id) } },
    select: {
      id: true,
      format: true,
      userId: true,
      bookmarkId: true,
      attempts: true,
      bookmark: { select: { url: true } },
    },
  })
}

export const pendingArchiveCount = () =>
  prisma.archive.count({
    where: { status: "PENDING", attempts: { lt: MAX_ATTEMPTS } },
  })
