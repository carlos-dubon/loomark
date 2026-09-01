const withUrl = (path: string, url: string) =>
  `${path}?url=${encodeURIComponent(url)}`

export const routes = {
  bookmarks: "/api/bookmarks",
  bookmark: (id: string) => `/api/bookmarks/${id}`,
  bookmarkPreview: (id: string) => `/api/bookmarks/${id}/preview`,
  bookmarkLookup: (url: string) => withUrl("/api/bookmarks/lookup", url),
  bookmarksImport: "/api/bookmarks/import",
  bookmarksRestore: "/api/bookmarks/restore",
  bookmarksReorder: "/api/bookmarks/reorder",
  collections: "/api/collections",
  collection: (id: string) => `/api/collections/${id}`,
  collectionsMove: "/api/collections/move",
  collectionsRestore: "/api/collections/restore",
  metadata: (url: string) => withUrl("/api/metadata", url),
  appearance: "/api/appearance",
  register: "/api/register",
  extensionToken: "/api/extension/token",
  adminUser: (id: string) => `/api/admin/users/${id}`,
  adminUserPassword: (id: string) => `/api/admin/users/${id}/password`,
} as const
