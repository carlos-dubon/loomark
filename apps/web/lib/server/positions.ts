import { insertAt, slotForTypeIndex } from "@loomark/core/order"

import { prisma } from "@/lib/server/prisma"
import {
  containerOf,
  loadSiblings,
  renumber,
  unsortedCollectionId,
} from "@/lib/server/siblings"

export const firstBookmarkPlacement = async (
  userId: string,
  collectionId: string
) => {
  const unsortedId = await unsortedCollectionId(userId)
  const siblings = await loadSiblings(
    userId,
    containerOf(collectionId, unsortedId),
    unsortedId
  )
  const position = slotForTypeIndex(siblings, "bookmark", 0)

  return {
    position,
    shift: renumber(
      insertAt(
        siblings,
        { type: "bookmark", id: "", title: "", position },
        position
      )
    ),
  }
}

export const nextPinnedPosition = async (userId: string) => {
  const { _max } = await prisma.bookmark.aggregate({
    where: { userId, pinned: true },
    _max: { pinnedPosition: true },
  })

  return (_max.pinnedPosition ?? -1) + 1
}
