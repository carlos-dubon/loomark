export type BookmarkDTO = {
  id: string
  url: string
  title: string
  description: string | null
  faviconUrl: string | null
  previewUrl: string | null
  pinned: boolean
  collectionId: string
  createdAt: string
  updatedAt: string
}

export type CollectionKind = "USER" | "UNSORTED"

export type CollectionDTO = {
  id: string
  name: string
  kind: CollectionKind
  position: number
  parentId: string | null
  bookmarkCount: number
}

export type CollectionNode = CollectionDTO & {
  children: CollectionNode[]
  totalCount: number
}

export type UrlMetadata = {
  url: string
  title: string
  description: string | null
  faviconUrl: string | null
  previewUrl: string | null
}

export type ImportSummary = {
  bookmarks: number
  collections: number
  duplicates: number
  skipped: number
}
