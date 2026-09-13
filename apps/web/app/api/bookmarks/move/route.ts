import { slotForTypeIndex, type Sibling } from "@loomark/core/order"

import { jsonError, parseBody, withUser } from "@/lib/server/api"
import { resolveCollectionId } from "@/lib/server/collections"
import { prisma } from "@/lib/server/prisma"
import { bookmarkMoveSchema } from "@/lib/schemas"
import { serializeBookmark } from "@/lib/server/serialize"
import {
  containerOf,
  loadSiblings,
  renumber,
  unsortedCollectionId,
} from "@/lib/server/siblings"

export const POST = withUser(async (request, userId) => {
  const { data, response } = await parseBody(request, bookmarkMoveSchema)

  if (!data) {
    return response
  }

  const collectionId = await resolveCollectionId(userId, data.collectionId)

  if (!collectionId) {
    return jsonError("Collection not found", 404)
  }

  const ids = [...new Set(data.ids)]
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, id: { in: ids } },
    select: { id: true, title: true, collectionId: true },
  })

  if (bookmarks.length !== ids.length) {
    return jsonError("Bookmark not found", 404)
  }

  const byId = new Map(bookmarks.map((bookmark) => [bookmark.id, bookmark]))
  const moving = ids.flatMap((id) => {
    const bookmark = byId.get(id)

    return bookmark && bookmark.collectionId !== collectionId ? [bookmark] : []
  })

  if (moving.length > 0) {
    const unsortedId = await unsortedCollectionId(userId)
    const siblings = await loadSiblings(
      userId,
      containerOf(collectionId, unsortedId),
      unsortedId
    )
    const slot = slotForTypeIndex(siblings, "bookmark", 0)
    const incoming = moving.map<Sibling>((bookmark) => ({
      type: "bookmark",
      id: bookmark.id,
      title: bookmark.title,
      position: -1,
    }))

    await prisma.$transaction([
      prisma.bookmark.updateMany({
        where: { userId, id: { in: moving.map((bookmark) => bookmark.id) } },
        data: { collectionId },
      }),
      ...renumber([
        ...siblings.slice(0, slot),
        ...incoming,
        ...siblings.slice(slot),
      ]),
    ])
  }

  const updated = await prisma.bookmark.findMany({
    where: { userId, id: { in: ids } },
  })

  return Response.json(updated.map(serializeBookmark))
})
