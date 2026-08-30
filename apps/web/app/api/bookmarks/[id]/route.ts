import { jsonError, parseBody, requireUserId } from "@/lib/api"
import { resolveCollectionId } from "@/lib/collections"
import { normalizeUrl } from "@/lib/format"
import { prisma } from "@/lib/prisma"
import { bookmarkUpdateSchema } from "@/lib/schemas"
import { serializeBookmark } from "@/lib/serialize"

type Context = { params: Promise<{ id: string }> }

export const GET = async (_request: Request, { params }: Context) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { id } = await params
  const bookmark = await prisma.bookmark.findFirst({
    where: { id, userId },
  })

  if (!bookmark) {
    return jsonError("Bookmark not found", 404)
  }

  return Response.json(serializeBookmark(bookmark))
}

export const PATCH = async (request: Request, { params }: Context) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { id } = await params
  const { data, response } = await parseBody(request, bookmarkUpdateSchema)

  if (!data) {
    return response
  }

  const existing = await prisma.bookmark.findFirst({
    where: { id, userId },
    select: { id: true, collectionId: true },
  })

  if (!existing) {
    return jsonError("Bookmark not found", 404)
  }

  let url: string | undefined

  try {
    url = data.url ? normalizeUrl(data.url) : undefined
  } catch {
    return jsonError("Enter a valid URL", 422)
  }

  let collectionId: string | undefined

  if (data.collectionId !== undefined) {
    const resolved = await resolveCollectionId(userId, data.collectionId)

    if (!resolved) {
      return jsonError("Collection not found", 404)
    }

    if (resolved !== existing.collectionId) {
      collectionId = resolved
    }
  }

  const bookmark = await prisma.bookmark.update({
    where: { id },
    data: {
      url,
      title: data.title,
      description: data.description,
      faviconUrl: data.faviconUrl,
      previewUrl: data.previewUrl,
      pinned: data.pinned,
      collectionId,
    },
  })

  return Response.json(serializeBookmark(bookmark))
}

export const DELETE = async (_request: Request, { params }: Context) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { id } = await params
  const deleted = await prisma.bookmark.deleteMany({ where: { id, userId } })

  if (deleted.count === 0) {
    return jsonError("Bookmark not found", 404)
  }

  return new Response(null, { status: 204 })
}
