import {
  ARCHIVE_FORMATS,
  type ArchiveFormat,
  type ArchiveSettings,
} from "@loomark/core/archive"

import { prisma } from "@/lib/prisma"

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
    data: { status: "PENDING", attempts: 0, error: null },
  })

  return count
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
