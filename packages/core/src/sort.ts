import type { BookmarkDTO } from "./types"

export const SORT_ORDERS = ["a-z", "z-a", "newest", "oldest"] as const

export type SortOrder = (typeof SORT_ORDERS)[number]

export const SORT_LABELS: Record<SortOrder, string> = {
  "a-z": "A–Z",
  "z-a": "Z–A",
  newest: "Newest",
  oldest: "Oldest",
}

const comparators: Record<
  SortOrder,
  (a: BookmarkDTO, b: BookmarkDTO) => number
> = {
  "a-z": (a, b) => a.title.localeCompare(b.title),
  "z-a": (a, b) => b.title.localeCompare(a.title),
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
}

export const sortBookmarks = (bookmarks: BookmarkDTO[], order: SortOrder) =>
  [...bookmarks].sort(comparators[order])

const KNOWN = new Set<string>(SORT_ORDERS)

export const toSortOrder = (value: string): SortOrder =>
  KNOWN.has(value) ? (value as SortOrder) : "newest"
