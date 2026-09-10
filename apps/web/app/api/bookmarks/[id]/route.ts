import { normalizeUrl } from "@loomark/core/url"

import { jsonError, parseBody, withUser } from "@/lib/server/api"
import { resolveCollectionId } from "@/lib/server/collections"
import {
  nextBookmarkPosition,
  nextPinnedPosition,
} from "@/lib/server/positions"
import { prisma } from "@/lib/server/prisma"
import { bookmarkUpdateSchema } from "@/lib/schemas"
import { serializeBookmark } from "@/lib/server/serialize"

type Context = { params: Promise<{ id: string }> }

export const GET = withUser(async (_request, userId, { params }: Context) => {
  const { id } = await params
  const bookmark = await prisma.bookmark.findFirst({
    where: { id, userId },
  })

  if (!bookmark) {
    return jsonError("Bookmark not found", 404)
  }

  return Response.json(serializeBookmark(bookmark))
})

export const PATCH = withUser(async (request, userId, { params }: Context) => {
  const { id } = await params
  const { data, response } = await parseBody(request, bookmarkUpdateSchema)

  if (!data) {
    return response
  }

  const existing = await prisma.bookmark.findFirst({
    where: { id, userId },
    select: { id: true, collectionId: true, pinned: true },
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

  const pinning = data.pinned === true && !existing.pinned

  const bookmark = await prisma.bookmark.update({
    where: { id },
    data: {
      url,
      title: data.title,
      description: data.description,
      faviconUrl: data.faviconUrl,
      previewUrl: data.previewUrl,
      pinned: data.pinned,
      position: collectionId
        ? await nextBookmarkPosition(userId, collectionId)
        : undefined,
      pinnedPosition: pinning ? await nextPinnedPosition(userId) : undefined,
      collectionId,
    },
  })

  return Response.json(serializeBookmark(bookmark))
})

export const DELETE = withUser(
  async (_request, userId, { params }: Context) => {
    const { id } = await params
    const deleted = await prisma.bookmark.deleteMany({ where: { id, userId } })

    if (deleted.count === 0) {
      return jsonError("Bookmark not found", 404)
    }

    return new Response(null, { status: 204 })
  }
)
