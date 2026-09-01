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

export type ActiveTab = {
  id: number | null
  url: string
  title: string
  faviconUrl: string | null
}
