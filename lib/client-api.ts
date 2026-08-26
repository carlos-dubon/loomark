import type {
  BookmarkCreateInput,
  BookmarkUpdateInput,
  CollectionCreateInput,
  CollectionMoveInput,
  CollectionUpdateInput,
} from "@/lib/schemas"
import type {
  BookmarkDTO,
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
  deleteBookmark: (id: string) =>
    request<void>(`/api/bookmarks/${id}`, { method: "DELETE" }),
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
    request<void>(`/api/collections/${id}`, { method: "DELETE" }),
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
  register: (input: { name: string; email: string; password: string }) =>
    request<{ id: string; email: string }>("/api/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
}
