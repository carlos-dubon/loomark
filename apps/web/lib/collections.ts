import { prisma } from "@/lib/prisma"

const UNSORTED_NAME = "Unsorted"

export const ensureUnsortedCollection = async (userId: string) => {
  const existing = await prisma.collection.findFirst({
    where: { userId, kind: "UNSORTED" },
    select: { id: true },
  })

  if (existing) {
    return existing.id
  }

  const created = await prisma.collection.create({
    data: { userId, name: UNSORTED_NAME, kind: "UNSORTED" },
    select: { id: true },
  })

  return created.id
}

export const resolveCollectionId = async (
  userId: string,
  collectionId: string | null | undefined
) => {
  if (!collectionId) {
    return ensureUnsortedCollection(userId)
  }

  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  })

  return collection?.id ?? null
}
