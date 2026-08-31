import { jsonError, requireUserId } from "@/lib/api"
import { fetchUrlMetadata } from "@/lib/metadata"
import { prisma } from "@/lib/prisma"
import { serializeBookmark } from "@/lib/serialize"

type Context = { params: Promise<{ id: string }> }

export const POST = async (_request: Request, { params }: Context) => {
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
}
