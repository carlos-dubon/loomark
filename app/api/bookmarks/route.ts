import { jsonError, parseBody, parseQuery, requireUserId } from "@/lib/api"
import { resolveCollectionId } from "@/lib/collections"
import { normalizeUrl } from "@/lib/format"
import { fetchUrlMetadata } from "@/lib/metadata"
import { prisma } from "@/lib/prisma"
import { getBookmarks } from "@/lib/queries"
import { bookmarkCreateSchema, bookmarkQuerySchema } from "@/lib/schemas"
import { serializeBookmark } from "@/lib/serialize"

export const GET = async (request: Request) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

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
}

export const POST = async (request: Request) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

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

  const bookmark = await prisma.bookmark.create({
    data: {
      userId,
      url,
      title: data.title ?? metadata?.title ?? url,
      description: data.description ?? metadata?.description ?? null,
      faviconUrl: data.faviconUrl ?? metadata?.faviconUrl ?? null,
      previewUrl: data.previewUrl ?? metadata?.previewUrl ?? null,
      pinned: data.pinned ?? false,
      collectionId,
    },
  })

  return Response.json(serializeBookmark(bookmark), { status: 201 })
}
