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
  favicon: (url: string) => withUrl("/api/favicon", url),
  metadata: (url: string) => withUrl("/api/metadata", url),
  appearance: "/api/appearance",
  profileAvatar: "/api/profile/avatar",
  userAvatar: (id: string) => `/api/users/${id}/avatar`,
  health: "/api/health",
  sync: "/api/sync",
  updates: (force?: boolean) =>
    force ? "/api/updates?force=1" : "/api/updates",
  updateInstall: "/api/updates/install",
  register: "/api/register",
  extensionToken: "/api/extension/token",
  adminUser: (id: string) => `/api/admin/users/${id}`,
  adminUserPassword: (id: string) => `/api/admin/users/${id}/password`,
} as const
