import { createReadStream } from "node:fs"
import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import { Readable } from "node:stream"

import {
  ARCHIVE_EXTENSIONS,
  ARCHIVE_SLUGS,
  type ArchiveFormat,
} from "@loomark/core/archive"

export const archiveRoot = () => {
  const configured = process.env.ARCHIVE_DIR

  return configured
    ? path.resolve(/* turbopackIgnore: true */ configured)
    : path.join(process.cwd(), ".archives")
}

export const archiveRelativePath = (
  userId: string,
  bookmarkId: string,
  format: ArchiveFormat
) =>
  path.posix.join(
    userId,
    bookmarkId,
    `${ARCHIVE_SLUGS[format]}.${ARCHIVE_EXTENSIONS[format]}`
  )

const resolveInsideRoot = (relative: string) => {
  const root = archiveRoot()
  const full = path.resolve(root, relative)

  return full === root || full.startsWith(`${root}${path.sep}`) ? full : null
}

export const writeArchive = async (relative: string, data: Buffer) => {
  const full = resolveInsideRoot(relative)

  if (!full) {
    throw new Error("Archive path escapes the archive directory")
  }

  await mkdir(path.dirname(full), { recursive: true })
  await writeFile(full, data)

  return data.byteLength
}

export const openArchive = async (relative: string) => {
  const full = resolveInsideRoot(relative)

  if (!full) {
    return null
  }

  const info = await stat(full).catch(() => null)

  if (!info?.isFile()) {
    return null
  }

  return {
    bytes: info.size,
    updatedAt: info.mtime,
    body: Readable.toWeb(
      createReadStream(full)
    ) as unknown as ReadableStream<Uint8Array>,
  }
}

const removeRelative = async (relative: string) => {
  const full = resolveInsideRoot(relative)

  if (full && full !== archiveRoot()) {
    await rm(full, { recursive: true, force: true })
  }
}

export const removeArchive = (relative: string) => removeRelative(relative)

export const removeUserArchives = (userId: string) => removeRelative(userId)

const directoryBytes = async (dir: string): Promise<number> => {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  const sizes = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name)

      return entry.isDirectory()
        ? directoryBytes(full)
        : stat(full)
            .then((info) => info.size)
            .catch(() => 0)
    })
  )

  return sizes.reduce((total, size) => total + size, 0)
}

export const archiveBytesFor = async (userId: string) => {
  const full = resolveInsideRoot(userId)

  return full ? directoryBytes(full) : 0
}

export const removeBookmarkArchives = (userId: string, bookmarkId: string) =>
  removeRelative(path.posix.join(userId, bookmarkId))

export const listStoredBookmarkIds = async (userId: string) =>
  readdir(path.join(archiveRoot(), userId), { withFileTypes: true })
    .then((entries) =>
      entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
    )
    .catch(() => [] as string[])

export const listStoredUserIds = async () =>
  readdir(archiveRoot(), { withFileTypes: true })
    .then((entries) =>
      entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
    )
    .catch(() => [] as string[])
