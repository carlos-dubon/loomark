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

  if (bookmark.previewUrl) {
    return Response.json(serializeBookmark(bookmark))
  }

  const metadata = await fetchUrlMetadata(bookmark.url)

  if (!metadata.previewUrl) {
    return Response.json(serializeBookmark(bookmark))
  }

  const updated = await prisma.bookmark.update({
    where: { id },
    data: {
      previewUrl: metadata.previewUrl,
      description: bookmark.description ?? metadata.description,
      faviconUrl: bookmark.faviconUrl ?? metadata.faviconUrl,
    },
  })

  return Response.json(serializeBookmark(updated))
}
