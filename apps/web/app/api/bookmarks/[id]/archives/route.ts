import { ARCHIVE_FORMATS } from "@loomark/core/archive"

import { jsonError, parseBody, requireUserId } from "@/lib/api"
import { enabledFormatsFor, requeueArchives } from "@/lib/archives/queue"
import { prisma } from "@/lib/prisma"
import { archiveRunSchema } from "@/lib/schemas"
import { serializeArchive } from "@/lib/serialize"

type Context = { params: Promise<{ id: string }> }

const listArchives = async (userId: string, bookmarkId: string) =>
  (
    await prisma.archive.findMany({
      where: { userId, bookmarkId },
    })
  ).map(serializeArchive)

export const GET = async (_request: Request, { params }: Context) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { id } = await params
  const bookmark = await prisma.bookmark.findFirst({
    where: { id, userId },
    select: { id: true },
  })

  if (!bookmark) {
    return jsonError("Bookmark not found", 404)
  }

  return Response.json(await listArchives(userId, id))
}

export const POST = async (request: Request, { params }: Context) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { id } = await params
  const { data, response } = await parseBody(request, archiveRunSchema)

  if (!data) {
    return response
  }

  const bookmark = await prisma.bookmark.findFirst({
    where: { id, userId },
    select: { id: true },
  })

  if (!bookmark) {
    return jsonError("Bookmark not found", 404)
  }

  const enabled = await enabledFormatsFor(userId)
  const formats =
    data.formats ?? (enabled.length > 0 ? enabled : ARCHIVE_FORMATS.slice())

  await requeueArchives(userId, id, formats)

  return Response.json(await listArchives(userId, id))
}
