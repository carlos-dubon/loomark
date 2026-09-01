import type { ImportSummary } from "@loomark/core/types"

import { ensureUnsortedCollection } from "@/lib/collections"
import type {
  Bookmark,
  Collection,
  Prisma,
} from "@/lib/generated/prisma/client"
import type { NetscapeBookmark, NetscapeFolder } from "@/lib/netscape"
import { prisma } from "@/lib/prisma"

const MAX_BOOKMARKS = 10000

const MAX_DEPTH = 20

const CHUNK = 500

export const buildExportTree = (
  collections: Collection[],
  bookmarks: Bookmark[]
): NetscapeFolder => {
  const root: NetscapeFolder = {
    name: "",
    addDate: null,
    folders: [],
    bookmarks: [],
  }

  const folders = new Map<string, NetscapeFolder>(
    collections.map((collection) => [
      collection.id,
      {
        name: collection.name,
        addDate: collection.createdAt,
        folders: [],
        bookmarks: [],
      },
    ])
  )

  for (const collection of collections) {
    const node = folders.get(collection.id)

    if (!node) {
      continue
    }

    const parent =
      (collection.parentId ? folders.get(collection.parentId) : null) ?? root

    parent.folders.push(node)
  }

  for (const bookmark of bookmarks) {
    const target = folders.get(bookmark.collectionId) ?? root

    target.bookmarks.push({
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description,
      faviconUrl: bookmark.faviconUrl,
      addDate: bookmark.createdAt,
      pinned: bookmark.pinned,
    })
  }

  return root
}

const importableUrl = (raw: string) => {
  try {
    const url = new URL(raw)

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null
    }

    const value = url.toString()

    return value.length <= 2000 ? value : null
  } catch {
    return null
  }
}

const countBookmarks = (folder: NetscapeFolder): number =>
  folder.bookmarks.length +
  folder.folders.reduce((sum, child) => sum + countBookmarks(child), 0)

const folderKey = (parentId: string | null, name: string) =>
  `${parentId ?? "root"}/${name.trim().toLowerCase()}`

export const importBookmarksTree = async (
  userId: string,
  root: NetscapeFolder
): Promise<ImportSummary> => {
  const [collections, existing] = await Promise.all([
    prisma.collection.findMany({
      where: { userId, kind: "USER" },
      select: { id: true, name: true, parentId: true },
    }),
    prisma.bookmark.findMany({
      where: { userId },
      select: {
        url: true,
        collectionId: true,
        position: true,
        pinned: true,
        pinnedPosition: true,
      },
    }),
  ])

  const seen = new Set(existing.map((bookmark) => bookmark.url))
  const nextPosition = new Map<string, number>()
  let nextPinnedPosition = 0

  for (const bookmark of existing) {
    nextPosition.set(
      bookmark.collectionId,
      Math.max(
        nextPosition.get(bookmark.collectionId) ?? 0,
        bookmark.position + 1
      )
    )

    if (bookmark.pinned) {
      nextPinnedPosition = Math.max(
        nextPinnedPosition,
        bookmark.pinnedPosition + 1
      )
    }
  }
  const collectionIds = new Map(
    collections.map((collection) => [
      folderKey(collection.parentId, collection.name),
      collection.id,
    ])
  )

  const summary: ImportSummary = {
    bookmarks: 0,
    collections: 0,
    duplicates: 0,
    skipped: 0,
  }

  const pending: Prisma.BookmarkCreateManyInput[] = []

  const ensureCollection = async (
    folder: NetscapeFolder,
    parentId: string | null
  ) => {
    const name = folder.name.trim().slice(0, 80) || "Imported"
    const key = folderKey(parentId, name)
    const known = collectionIds.get(key)

    if (known) {
      return known
    }

    const created = await prisma.collection.create({
      data: {
        userId,
        name,
        parentId,
      },
      select: { id: true },
    })

    collectionIds.set(key, created.id)
    summary.collections += 1

    return created.id
  }

  const addBookmark = (bookmark: NetscapeBookmark, collectionId: string) => {
    if (pending.length >= MAX_BOOKMARKS) {
      return
    }

    const url = importableUrl(bookmark.url)

    if (!url) {
      summary.skipped += 1
      return
    }

    if (seen.has(url)) {
      summary.duplicates += 1
      return
    }

    seen.add(url)

    const position = nextPosition.get(collectionId) ?? 0
    nextPosition.set(collectionId, position + 1)

    pending.push({
      userId,
      url,
      title: bookmark.title.slice(0, 300) || new URL(url).hostname,
      description: bookmark.description?.slice(0, 2000) ?? null,
      faviconUrl: bookmark.faviconUrl,
      pinned: bookmark.pinned,
      position,
      pinnedPosition: bookmark.pinned ? nextPinnedPosition++ : 0,
      collectionId,
      ...(bookmark.addDate ? { createdAt: bookmark.addDate } : {}),
    })
  }

  const walk = async (
    folder: NetscapeFolder,
    collectionId: string,
    parentId: string | null,
    depth: number
  ) => {
    for (const bookmark of folder.bookmarks) {
      addBookmark(bookmark, collectionId)
    }

    for (const child of folder.folders) {
      if (countBookmarks(child) === 0) {
        continue
      }

      if (depth >= MAX_DEPTH) {
        await walk(child, collectionId, parentId, depth)
        continue
      }

      const created = await ensureCollection(child, parentId)

      await walk(child, created, created, depth + 1)
    }
  }

  await walk(root, await ensureUnsortedCollection(userId), null, 0)

  for (let index = 0; index < pending.length; index += CHUNK) {
    const batch = pending.slice(index, index + CHUNK)
    const { count } = await prisma.bookmark.createMany({ data: batch })
    summary.bookmarks += count
  }

  return summary
}
