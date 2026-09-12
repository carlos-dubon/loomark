import { normalizeUrl } from "@loomark/core/url"

import { jsonError, parseBody, parseQuery, withUser } from "@/lib/server/api"
import { resolveCollectionId } from "@/lib/server/collections"
import { fetchUrlMetadata } from "@/lib/server/metadata"
import {
  firstBookmarkPlacement,
  nextPinnedPosition,
} from "@/lib/server/positions"
import { prisma } from "@/lib/server/prisma"
import { getBookmarks } from "@/lib/server/queries"
import {
  bookmarkBulkDeleteSchema,
  bookmarkCreateSchema,
  bookmarkQuerySchema,
} from "@/lib/schemas"
import { serializeBookmark } from "@/lib/server/serialize"

export const GET = withUser(async (request, userId) => {
  const { data, response } = parseQuery(request, bookmarkQuerySchema)

  if (!data) {
    return response
  }

  const bookmarks = await getBookmarks(userId, {
    q: data.q,
    collectionId: data.collectionId,
    pinned: data.pinned === "true",
    unsorted: data.unsorted === "true",
    take: data.take,
    skip: data.skip,
  })

  return Response.json(bookmarks)
})

export const POST = withUser(async (request, userId) => {
  const { data, response } = await parseBody(request, bookmarkCreateSchema)

  if (!data) {
    return response
  }

  let url: string

  try {
    url = normalizeUrl(data.url)
  } catch {
    return jsonError("Enter a valid URL", 422)
  }

  const needsMetadata = !data.title || !data.faviconUrl
  const metadata = needsMetadata ? await fetchUrlMetadata(url) : null
  const collectionId = await resolveCollectionId(userId, data.collectionId)

  if (!collectionId) {
    return jsonError("Collection not found", 404)
  }

  const pinned = data.pinned ?? false
  const { position, shift } = await firstBookmarkPlacement(userId, collectionId)

  const [bookmark] = await prisma.$transaction([
    prisma.bookmark.create({
      data: {
        userId,
        url,
        title: data.title ?? metadata?.title ?? url,
        description: data.description ?? metadata?.description ?? null,
        faviconUrl: data.faviconUrl ?? metadata?.faviconUrl ?? null,
        previewUrl: data.previewUrl ?? metadata?.previewUrl ?? null,
        pinned,
        position,
        pinnedPosition: pinned ? await nextPinnedPosition(userId) : 0,
        collectionId,
      },
    }),
    ...shift,
  ])

  return Response.json(serializeBookmark(bookmark), { status: 201 })
})

export const DELETE = withUser(async (request, userId) => {
  const { data, response } = await parseBody(request, bookmarkBulkDeleteSchema)

  if (!data) {
    return response
  }

  const { count } = await prisma.bookmark.deleteMany({
    where: { userId, id: { in: data.ids } },
  })

  return Response.json({ count })
})
