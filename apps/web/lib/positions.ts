import { prisma } from "@/lib/prisma"

export const nextBookmarkPosition = async (
  userId: string,
  collectionId: string
) => {
  const { _max } = await prisma.bookmark.aggregate({
    where: { userId, collectionId },
    _max: { position: true },
  })

  return (_max.position ?? -1) + 1
}

export const nextPinnedPosition = async (userId: string) => {
  const { _max } = await prisma.bookmark.aggregate({
    where: { userId, pinned: true },
    _max: { pinnedPosition: true },
  })

  return (_max.pinnedPosition ?? -1) + 1
}
