import { reorderWithin } from "@loomark/core/order"
import { jsonError, parseBody, requireUserId } from "@/lib/api"
import { prisma } from "@/lib/prisma"
import { bookmarkReorderSchema } from "@/lib/schemas"
import {
  containerOf,
  loadSiblings,
  renumber,
  unsortedCollectionId,
} from "@/lib/siblings"

const reorderPinned = async (userId: string, ids: string[]) => {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, id: { in: ids }, pinned: true },
    select: { id: true, pinnedPosition: true },
  })

  if (bookmarks.length !== ids.length) {
    return jsonError("Bookmark not found", 404)
  }

  const current = new Map(bookmarks.map((bookmark) => [bookmark.id, bookmark]))

  const updates = ids.flatMap((id, pinnedPosition) =>
    current.get(id)?.pinnedPosition === pinnedPosition
      ? []
      : [prisma.bookmark.update({ where: { id }, data: { pinnedPosition } })]
  )

  if (updates.length > 0) {
    await prisma.$transaction(updates)
  }

  return new Response(null, { status: 204 })
}

export const POST = async (request: Request) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { data, response } = await parseBody(request, bookmarkReorderSchema)

  if (!data) {
    return response
  }

  if (data.scope === "pinned") {
    return reorderPinned(userId, data.ids)
  }

  const unsortedId = await unsortedCollectionId(userId)
  const container = containerOf(data.collectionId, unsortedId)
  const siblings = await loadSiblings(userId, container, unsortedId)

  const known = new Set(
    siblings.flatMap((sibling) =>
      sibling.type === "bookmark" ? [sibling.id] : []
    )
  )

  if (data.ids.some((id) => !known.has(id))) {
    return jsonError("Bookmark not found", 404)
  }

  const updates = renumber(reorderWithin(siblings, "bookmark", data.ids))

  if (updates.length > 0) {
    await prisma.$transaction(updates)
  }

  return new Response(null, { status: 204 })
}
