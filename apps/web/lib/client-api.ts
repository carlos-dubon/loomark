import type {
  AppearanceUpdateInput,
  BookmarkCreateInput,
  BookmarkUpdateInput,
  CollectionCreateInput,
  CollectionMoveInput,
  CollectionUpdateInput,
} from "@/lib/schemas"
import type { AppearanceDTO } from "@/lib/themes/appearance"
import type {
  BookmarkDTO,
  CollectionDeletion,
  CollectionDTO,
  ImportSummary,
  UrlMetadata,
} from "@/lib/types"

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
    request<BookmarkDTO[]>(`/api/bookmarks?${toSearchParams(query)}`, {
      signal,
    }),
  createBookmark: (input: BookmarkCreateInput) =>
    request<BookmarkDTO>("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateBookmark: (id: string, input: BookmarkUpdateInput) =>
    request<BookmarkDTO>(`/api/bookmarks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deleteBookmarks: (ids: string[]) =>
    request<{ count: number }>("/api/bookmarks", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
  restoreBookmarks: (bookmarks: BookmarkDTO[]) =>
    request<BookmarkDTO[]>("/api/bookmarks/restore", {
      method: "POST",
      body: JSON.stringify({ bookmarks }),
    }),
  refreshPreview: (id: string) =>
    request<BookmarkDTO>(`/api/bookmarks/${id}/preview`, { method: "POST" }),
  listCollections: () => request<CollectionDTO[]>("/api/collections"),
  createCollection: (input: CollectionCreateInput) =>
    request<CollectionDTO>("/api/collections", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateCollection: (id: string, input: CollectionUpdateInput) =>
    request<CollectionDTO>(`/api/collections/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  moveCollection: (input: CollectionMoveInput) =>
    request<CollectionDTO[]>("/api/collections/move", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  deleteCollection: (id: string) =>
    request<CollectionDeletion>(`/api/collections/${id}`, { method: "DELETE" }),
  restoreCollection: (deletion: CollectionDeletion) =>
    request<CollectionDTO[]>("/api/collections/restore", {
      method: "POST",
      body: JSON.stringify(deletion),
    }),
  fetchMetadata: (url: string, signal?: AbortSignal) =>
    request<UrlMetadata>(`/api/metadata?url=${encodeURIComponent(url)}`, {
      signal,
    }),
  importBookmarks: (file: File) => {
    const body = new FormData()
    body.append("file", file)

    return request<ImportSummary>("/api/bookmarks/import", {
      method: "POST",
      body,
    })
  },
  updateAppearance: (input: AppearanceUpdateInput) =>
    request<AppearanceDTO>("/api/appearance", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  resetUserPassword: (id: string, password: string) =>
    request<void>(`/api/admin/users/${id}/password`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  deleteUser: (id: string) =>
    request<void>(`/api/admin/users/${id}`, { method: "DELETE" }),
  register: (input: { name: string; email: string; password: string }) =>
    request<{ id: string; email: string }>("/api/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
}
