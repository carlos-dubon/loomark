import { prisma } from "@/lib/prisma"
import {
  containerOf,
  nextSiblingPosition,
  unsortedCollectionId,
} from "@/lib/siblings"

export const nextBookmarkPosition = async (
  userId: string,
  collectionId: string
) => {
  const unsortedId = await unsortedCollectionId(userId)

  return nextSiblingPosition(
    userId,
    containerOf(collectionId, unsortedId),
    unsortedId
  )
}

export const nextPinnedPosition = async (userId: string) => {
  const { _max } = await prisma.bookmark.aggregate({
    where: { userId, pinned: true },
    _max: { pinnedPosition: true },
  })

  return (_max.pinnedPosition ?? -1) + 1
}
