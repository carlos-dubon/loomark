import type { Bookmark, Collection } from "@/lib/generated/prisma/client"
import type { BookmarkDTO, CollectionDTO } from "@/lib/types"

export const serializeBookmark = (bookmark: Bookmark): BookmarkDTO => ({
  id: bookmark.id,
  url: bookmark.url,
  title: bookmark.title,
  description: bookmark.description,
  faviconUrl: bookmark.faviconUrl,
  previewUrl: bookmark.previewUrl,
  pinned: bookmark.pinned,
  collectionId: bookmark.collectionId,
  createdAt: bookmark.createdAt.toISOString(),
  updatedAt: bookmark.updatedAt.toISOString(),
})

export const serializeCollection = (
  collection: Collection & { _count?: { bookmarks: number } }
): CollectionDTO => ({
  id: collection.id,
  name: collection.name,
  icon: collection.icon,
  kind: collection.kind,
  position: collection.position,
  parentId: collection.parentId,
  bookmarkCount: collection._count?.bookmarks ?? 0,
})
