import { routes } from "@loomark/core/routes"
import type {
  BookmarkDTO,
  CollectionDeletion,
  CollectionDTO,
  CollectionShareDTO,
  ImportSummary,
  UrlMetadata,
} from "@loomark/core/types"

import type {
  AppearanceUpdateInput,
  BookmarkCreateInput,
  BookmarkReorderInput,
  BookmarkUpdateInput,
  CollectionCreateInput,
  CollectionMoveInput,
  CollectionUpdateInput,
} from "@/lib/schemas"
import type { AppearanceDTO } from "@/lib/themes/appearance"

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const json = !(init?.body instanceof FormData)
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(json ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string
    } | null

    throw new Error(payload?.error ?? "Something went wrong")
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

type BookmarkQuery = {
  q?: string
  collectionId?: string
  pinned?: boolean
  unsorted?: boolean
  take?: number
}

const toSearchParams = (query: BookmarkQuery) => {
  const params = new URLSearchParams()

  if (query.q) params.set("q", query.q)
  if (query.collectionId) params.set("collectionId", query.collectionId)
  if (query.pinned) params.set("pinned", "true")
  if (query.unsorted) params.set("unsorted", "true")
  if (query.take) params.set("take", String(query.take))

  return params.toString()
}

export const api = {
  listBookmarks: (query: BookmarkQuery = {}, signal?: AbortSignal) =>
    request<BookmarkDTO[]>(`${routes.bookmarks}?${toSearchParams(query)}`, {
      signal,
    }),
  createBookmark: (input: BookmarkCreateInput) =>
    request<BookmarkDTO>(routes.bookmarks, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateBookmark: (id: string, input: BookmarkUpdateInput) =>
    request<BookmarkDTO>(routes.bookmark(id), {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deleteBookmarks: (ids: string[]) =>
    request<{ count: number }>(routes.bookmarks, {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
  restoreBookmarks: (bookmarks: BookmarkDTO[]) =>
    request<BookmarkDTO[]>(routes.bookmarksRestore, {
      method: "POST",
      body: JSON.stringify({ bookmarks }),
    }),
  reorderBookmarks: (input: BookmarkReorderInput) =>
    request<void>(routes.bookmarksReorder, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  refreshPreview: (id: string) =>
    request<BookmarkDTO>(routes.bookmarkPreview(id), { method: "POST" }),
  listCollections: () => request<CollectionDTO[]>(routes.collections),
  createCollection: (input: CollectionCreateInput) =>
    request<CollectionDTO>(routes.collections, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateCollection: (id: string, input: CollectionUpdateInput) =>
    request<CollectionDTO>(routes.collection(id), {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  moveCollection: (input: CollectionMoveInput) =>
    request<CollectionDTO[]>(routes.collectionsMove, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  deleteCollection: (id: string) =>
    request<CollectionDeletion>(routes.collection(id), { method: "DELETE" }),
  shareCollection: (id: string) =>
    request<CollectionShareDTO>(routes.collectionShare(id), {
      method: "POST",
    }),
  unshareCollection: (id: string) =>
    request<CollectionShareDTO>(routes.collectionShare(id), {
      method: "DELETE",
    }),
  restoreCollection: (deletion: CollectionDeletion) =>
    request<CollectionDTO[]>(routes.collectionsRestore, {
      method: "POST",
      body: JSON.stringify(deletion),
    }),
  fetchMetadata: (url: string, signal?: AbortSignal) =>
    request<UrlMetadata>(routes.metadata(url), {
      signal,
    }),
  importBookmarks: (file: File) => {
    const body = new FormData()
    body.append("file", file)

    return request<ImportSummary>(routes.bookmarksImport, {
      method: "POST",
      body,
    })
  },
  updateAppearance: (input: AppearanceUpdateInput) =>
    request<AppearanceDTO>(routes.appearance, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  resetUserPassword: (id: string, password: string) =>
    request<void>(routes.adminUserPassword(id), {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  deleteUser: (id: string) =>
    request<void>(routes.adminUser(id), { method: "DELETE" }),
  register: (input: { name: string; email: string; password: string }) =>
    request<{ id: string; email: string }>(routes.register, {
      method: "POST",
      body: JSON.stringify(input),
    }),
}
