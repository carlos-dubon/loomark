import type { BookmarkDTO } from "./types"

export const SORT_ORDERS = ["a-z", "z-a", "newest", "oldest", "custom"] as const

export type SortOrder = (typeof SORT_ORDERS)[number]

export const ORDER_SCOPES = ["collection", "pinned"] as const

export type OrderScope = (typeof ORDER_SCOPES)[number]

export const SORT_LABELS: Record<SortOrder, string> = {
  "a-z": "A–Z",
  "z-a": "Z–A",
  newest: "Newest",
  oldest: "Oldest",
  custom: "Custom",
}

const positionOf = (bookmark: BookmarkDTO, scope: OrderScope) =>
  scope === "pinned" ? bookmark.pinnedPosition : bookmark.position

const comparators: Record<
  SortOrder,
  (a: BookmarkDTO, b: BookmarkDTO, scope: OrderScope) => number
> = {
  "a-z": (a, b) => a.title.localeCompare(b.title),
  "z-a": (a, b) => b.title.localeCompare(a.title),
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  custom: (a, b, scope) =>
    positionOf(a, scope) - positionOf(b, scope) ||
    b.createdAt.localeCompare(a.createdAt),
}

export const sortBookmarks = (
  bookmarks: BookmarkDTO[],
  order: SortOrder,
  scope: OrderScope = "collection"
) => [...bookmarks].sort((a, b) => comparators[order](a, b, scope))

export const applyManualOrder = (
  bookmarks: BookmarkDTO[],
  scope: OrderScope
): BookmarkDTO[] =>
  bookmarks.map((bookmark, index) =>
    scope === "pinned"
      ? { ...bookmark, pinnedPosition: index }
      : { ...bookmark, position: index }
  )

const KNOWN = new Set<string>(SORT_ORDERS)

export const toSortOrder = (value: string): SortOrder =>
  KNOWN.has(value) ? (value as SortOrder) : "newest"
