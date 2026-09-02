import {
  ARCHIVE_CONTENT_TYPES,
  ARCHIVE_EXTENSIONS,
  toArchiveFormat,
} from "@loomark/core/archive"

import { jsonError, requireUserId } from "@/lib/api"
import { openArchive } from "@/lib/archives/storage"
import { prisma } from "@/lib/prisma"

type Context = { params: Promise<{ id: string; format: string }> }

const SAFE_NAME = /[^a-z0-9]+/gi

const WEBPAGE_CSP =
  "sandbox; default-src 'none'; img-src data: blob:; style-src 'unsafe-inline' data:; font-src data:; object-src 'none'"

const fileName = (title: string, extension: string) => {
  const slug = title.replace(SAFE_NAME, "-").replace(/^-|-$/g, "").slice(0, 80)

  return `${slug.toLowerCase() || "archive"}.${extension}`
}

export const GET = async (_request: Request, { params }: Context) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { id, format: slug } = await params
  const format = toArchiveFormat(slug)

  if (!format) {
    return jsonError("Unknown archive format", 404)
  }

  const archive = await prisma.archive.findFirst({
    where: { bookmarkId: id, userId, format },
    select: { path: true, bookmark: { select: { title: true } } },
  })

  if (!archive?.path) {
    return jsonError("Archive not found", 404)
  }

  const file = await openArchive(archive.path)

  if (!file) {
    return jsonError("Archive not found", 404)
  }

  const headers = new Headers({
    "content-type": ARCHIVE_CONTENT_TYPES[format],
    "content-length": String(file.bytes),
    "content-disposition": `inline; filename="${fileName(archive.bookmark.title, ARCHIVE_EXTENSIONS[format])}"`,
    "x-content-type-options": "nosniff",
    "cache-control": "private, max-age=0, must-revalidate",
    "last-modified": file.updatedAt.toUTCString(),
  })

  if (format === "WEBPAGE") {
    headers.set("content-security-policy", WEBPAGE_CSP)
  }

  return new Response(file.body, { headers })
}
