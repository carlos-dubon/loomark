import { jsonError, parseBody, requireUserId } from "@/lib/api"
import { prisma } from "@/lib/prisma"
import { bookmarkReorderSchema } from "@/lib/schemas"

export const POST = async (request: Request) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { data, response } = await parseBody(request, bookmarkReorderSchema)

  if (!data) {
    return response
  }

  const pinned = data.scope === "pinned"

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId,
      id: { in: data.ids },
      ...(pinned ? { pinned: true } : {}),
      ...(!pinned && data.collectionId
        ? { collectionId: data.collectionId }
        : {}),
    },
    select: { id: true, position: true, pinnedPosition: true },
  })

  if (bookmarks.length !== data.ids.length) {
    return jsonError("Bookmark not found", 404)
  }

  const current = new Map(bookmarks.map((bookmark) => [bookmark.id, bookmark]))

  const updates = data.ids.flatMap((id, position) => {
    const bookmark = current.get(id)

    if (!bookmark) {
      return []
    }

    const stored = pinned ? bookmark.pinnedPosition : bookmark.position

    if (stored === position) {
      return []
    }

    return [
      prisma.bookmark.update({
        where: { id },
        data: pinned ? { pinnedPosition: position } : { position },
      }),
    ]
  })

  if (updates.length > 0) {
    await prisma.$transaction(updates)
  }

  return new Response(null, { status: 204 })
}
