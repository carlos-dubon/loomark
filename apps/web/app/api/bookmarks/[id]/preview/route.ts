import { jsonError, withUser } from "@/lib/server/api"
import { fetchUrlMetadata } from "@/lib/server/metadata"
import { prisma } from "@/lib/server/prisma"
import { serializeBookmark } from "@/lib/server/serialize"

type Context = { params: Promise<{ id: string }> }

export const POST = withUser(async (_request, userId, { params }: Context) => {
  const { id } = await params
  const bookmark = await prisma.bookmark.findFirst({
    where: { id, userId },
  })

  if (!bookmark) {
    return jsonError("Bookmark not found", 404)
  }

  if (bookmark.previewUrl && bookmark.faviconUrl) {
    return Response.json(serializeBookmark(bookmark))
  }

  const metadata = await fetchUrlMetadata(bookmark.url)
  const previewUrl = bookmark.previewUrl ?? metadata.previewUrl
  const faviconUrl = bookmark.faviconUrl ?? metadata.faviconUrl

  if (
    previewUrl === bookmark.previewUrl &&
    faviconUrl === bookmark.faviconUrl
  ) {
    return Response.json(serializeBookmark(bookmark))
  }

  const updated = await prisma.bookmark.update({
    where: { id },
    data: {
      previewUrl,
      description: bookmark.description ?? metadata.description,
      faviconUrl,
    },
  })

  return Response.json(serializeBookmark(updated))
})
