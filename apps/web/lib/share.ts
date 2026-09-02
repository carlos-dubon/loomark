import { randomBytes } from "node:crypto"
import { cache } from "react"

import { sortBookmarks } from "@loomark/core/sort"
import { collectDescendantIds } from "@loomark/core/tree"
import type {
  SharedCollectionDTO,
  SharedCollectionPage,
} from "@loomark/core/types"

import { getAppearance } from "@/lib/appearance"
import { prisma } from "@/lib/prisma"
import {
  serializeBookmark,
  serializeSharedBookmark,
  serializeSharedCollection,
} from "@/lib/serialize"

export const createShareToken = () => randomBytes(16).toString("base64url")

const sharedRoot = cache(async (token: string) => {
  const root = await prisma.collection.findUnique({
    where: { shareToken: token },
    include: {
      _count: { select: { bookmarks: true } },
      user: { select: { name: true } },
    },
  })

  if (!root?.sharedAt || root.kind !== "USER") {
    return null
  }

  return { ...root, sharedAt: root.sharedAt }
})

const sharedTree = cache(async (userId: string) =>
  prisma.collection.findMany({
    where: { userId },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { bookmarks: true } } },
  })
)

type OwnedCollection = Awaited<ReturnType<typeof sharedTree>>[number]

const trailTo = (
  owned: OwnedCollection[],
  rootId: string,
  collection: OwnedCollection
) => {
  const trail: SharedCollectionDTO[] = []
  const byId = new Map(owned.map((item) => [item.id, item]))
  let current = collection

  while (current.id !== rootId && current.parentId) {
    const parent = byId.get(current.parentId)

    if (!parent) {
      break
    }

    trail.unshift(serializeSharedCollection(parent))
    current = parent
  }

  return trail
}

export const getSharedCollection = cache(
  async (
    token: string,
    collectionId?: string
  ): Promise<SharedCollectionPage | null> => {
    const root = await sharedRoot(token)

    if (!root) {
      return null
    }

    const owned = await sharedTree(root.userId)
    const shared = new Set(collectDescendantIds(owned, root.id))
    const collection = collectionId
      ? owned.find((item) => item.id === collectionId && shared.has(item.id))
      : owned.find((item) => item.id === root.id)

    if (!collection) {
      return null
    }

    const [bookmarks, appearance] = await Promise.all([
      prisma.bookmark.findMany({ where: { collectionId: collection.id } }),
      getAppearance(root.userId),
    ])

    return {
      token,
      root: serializeSharedCollection(root),
      collection: serializeSharedCollection(collection),
      trail: trailTo(owned, root.id, collection),
      ownerName: root.user.name,
      sharedAt: root.sharedAt.toISOString(),
      themePreset: appearance.themePreset,
      bookmarks: sortBookmarks(
        bookmarks.map(serializeBookmark),
        appearance.sortOrder
      ).map(serializeSharedBookmark),
      subcollections: owned
        .filter((item) => item.parentId === collection.id)
        .map(serializeSharedCollection),
    }
  }
)

export const isSharedFaviconUrl = async (token: string, url: string) => {
  const root = await sharedRoot(token)

  if (!root) {
    return false
  }

  const owned = await sharedTree(root.userId)

  const bookmark = await prisma.bookmark.findFirst({
    where: {
      faviconUrl: url,
      collectionId: { in: collectDescendantIds(owned, root.id) },
    },
    select: { id: true },
  })

  return bookmark !== null
}
