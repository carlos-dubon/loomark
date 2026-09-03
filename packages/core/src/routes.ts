const withUrl = (path: string, url: string) =>
  `${path}?url=${encodeURIComponent(url)}`

export const routes = {
  bookmarks: "/api/bookmarks",
  bookmark: (id: string) => `/api/bookmarks/${id}`,
  bookmarkPreview: (id: string) => `/api/bookmarks/${id}/preview`,
  bookmarkArchives: (id: string) => `/api/bookmarks/${id}/archives`,
  bookmarkArchive: (id: string, format: string) =>
    `/api/bookmarks/${id}/archives/${format}`,
  bookmarkLookup: (url: string) => withUrl("/api/bookmarks/lookup", url),
  bookmarksImport: "/api/bookmarks/import",
  bookmarksRestore: "/api/bookmarks/restore",
  bookmarksReorder: "/api/bookmarks/reorder",
  collections: "/api/collections",
  collection: (id: string) => `/api/collections/${id}`,
  collectionShare: (id: string) => `/api/collections/${id}/share`,
  collectionsMove: "/api/collections/move",
  collectionsRestore: "/api/collections/restore",
  shareFavicon: (token: string, url: string) =>
    withUrl(`/api/share/${token}/favicon`, url),
  favicon: (url: string) => withUrl("/api/favicon", url),
  metadata: (url: string) => withUrl("/api/metadata", url),
  appearance: "/api/appearance",
  archiveSettings: "/api/archives/settings",
  archiveBackfill: "/api/archives/backfill",
  archiveStorage: "/api/archives/storage",
  register: "/api/register",
  extensionToken: "/api/extension/token",
  adminUser: (id: string) => `/api/admin/users/${id}`,
  adminUserPassword: (id: string) => `/api/admin/users/${id}/password`,
} as const

export const sharePath = (token: string, collectionId?: string | null) =>
  collectionId ? `/s/${token}/${collectionId}` : `/s/${token}`

export const shareUrl = (origin: string, token: string) =>
  `${origin}${sharePath(token)}`
