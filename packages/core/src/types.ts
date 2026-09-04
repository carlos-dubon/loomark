import type { ArchiveFormat, ArchiveStatus } from "./archive"

export type BookmarkDTO = {
  id: string
  url: string
  title: string
  description: string | null
  faviconUrl: string | null
  previewUrl: string | null
  pinned: boolean
  position: number
  pinnedPosition: number
  collectionId: string
  createdAt: string
  updatedAt: string
}

export type CollectionKind = "USER" | "UNSORTED"

export type CollectionDTO = {
  id: string
  name: string
  icon: string | null
  kind: CollectionKind
  position: number
  parentId: string | null
  bookmarkCount: number
  shareToken: string | null
}

export type SharedBookmarkDTO = {
  id: string
  url: string
  title: string
  description: string | null
  faviconUrl: string | null
  previewUrl: string | null
  createdAt: string
}

export type SharedCollectionDTO = {
  id: string
  name: string
  icon: string | null
  bookmarkCount: number
}

export type SharedCollectionPage = {
  token: string
  root: SharedCollectionDTO
  collection: SharedCollectionDTO
  trail: SharedCollectionDTO[]
  ownerName: string | null
  sharedAt: string
  themeId: string
  bookmarks: SharedBookmarkDTO[]
  subcollections: SharedCollectionDTO[]
}

export type CollectionShareDTO = {
  id: string
  shareToken: string | null
  sharedAt: string | null
}

export type CollectionNode = CollectionDTO & {
  children: CollectionNode[]
  totalCount: number
}

export type FlatCollection = CollectionNode & { depth: number }

export type CollectionDeletion = {
  collections: CollectionDTO[]
  bookmarks: BookmarkDTO[]
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

export type UserRole = "OWNER" | "MEMBER"

export type InstanceUserDTO = {
  id: string
  name: string | null
  email: string
  image: string | null
  role: UserRole
  createdAt: string
  bookmarkCount: number
  collectionCount: number
  bytes: number
}

export type Account = {
  id: string
  name: string | null
  email: string
}

export type Connection = {
  serverUrl: string
  token: string
  user: Account
}

export type SyncCollection = {
  id: string
  name: string
  parentId: string | null
  kind: CollectionKind
  position: number
}

export type SyncBookmark = {
  id: string
  url: string
  title: string
  collectionId: string
  position: number
}

export type SyncOrderGroup = {
  collectionId: string | null
  type: "collection" | "bookmark" | "all"
  ids: string[]
}

export type SyncSnapshot = {
  collections: SyncCollection[]
  bookmarks: SyncBookmark[]
}

export type ActiveTab = {
  id: number | null
  url: string
  title: string
  faviconUrl: string | null
}

export type ArchiveDTO = {
  format: ArchiveFormat
  status: ArchiveStatus
  bytes: number
  error: string | null
  updatedAt: string
}
