export type BookmarkQuery = {
  q?: string
  collectionId?: string
  pinned?: boolean
  unsorted?: boolean
  take?: number
}

export const PINNED_BOOKMARKS: BookmarkQuery = { pinned: true, take: 120 }

export const LIBRARY_PROBE: BookmarkQuery = { take: 1 }

export const collectionBookmarks = (collectionId: string): BookmarkQuery => ({
  collectionId,
  take: 200,
})

export const queryKeys = {
  appearance: ["appearance"] as const,
  collections: ["collections"] as const,
  bookmarks: ["bookmarks"] as const,
  bookmarkList: (query: BookmarkQuery) => ["bookmarks", query] as const,
  bookmarkPreview: (id: string) => ["bookmark-preview", id] as const,
  metadata: (url: string) => ["metadata", url] as const,
  updateStatus: ["update-status"] as const,
}
