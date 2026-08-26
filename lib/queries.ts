import type { Prisma } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { serializeBookmark, serializeCollection } from "@/lib/serialize"

type BookmarkFilters = {
  q?: string
  collectionId?: string
  unsorted?: boolean
  pinned?: boolean
  take?: number
  skip?: number
}

export const getCollections = async (userId: string) => {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { bookmarks: true } } },
  })

  return collections.map(serializeCollection)
}

export const getCollection = async (userId: string, id: string) => {
  const collection = await prisma.collection.findFirst({
    where: { id, userId },
    include: { _count: { select: { bookmarks: true } } },
  })

  return collection ? serializeCollection(collection) : null
}

export const getChildCollections = async (userId: string, parentId: string) => {
  const collections = await prisma.collection.findMany({
    where: { userId, parentId },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { bookmarks: true } } },
  })

  return collections.map(serializeCollection)
}

export const getBookmarks = async (
  userId: string,
  filters: BookmarkFilters = {}
) => {
  const where: Prisma.BookmarkWhereInput = { userId }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { url: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ]
  }

  if (filters.collectionId) {
    where.collectionId = filters.collectionId
  }

  if (filters.unsorted) {
    const unsorted = await prisma.collection.findFirst({
      where: { userId, kind: "UNSORTED" },
      select: { id: true },
    })

    where.collectionId = unsorted?.id ?? ""
  }

  if (filters.pinned) {
    where.pinned = true
  }

  const bookmarks = await prisma.bookmark.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters.take ?? 60,
    skip: filters.skip ?? 0,
  })

  return bookmarks.map(serializeBookmark)
}
