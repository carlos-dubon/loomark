import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

import type { BookmarkDTO, CollectionDTO } from "@loomark/core/types"
import { IDLE_UPDATE_JOB, type UpdateJob } from "@loomark/core/updates"

import type { BookmarkQuery } from "@/lib/query-keys"
import type { ThemeMode } from "@/lib/theme-mode"

export type BookmarkDialogState = {
  open: boolean
  bookmark: BookmarkDTO | null
  collectionId: string | null
}

export type CollectionDialogState = {
  open: boolean
  collection: CollectionDTO | null
  parentId: string | null
}

export const updateJobAtom = atom<UpdateJob>(IDLE_UPDATE_JOB)

export const activeBookmarkQueryAtom = atom<BookmarkQuery | null>(null)

export const selectedBookmarkIdsAtom = atom<ReadonlySet<string>>(
  new Set<string>()
)

export const toggleBookmarkSelectionAtom = atom(
  null,
  (get, set, id: string) => {
    const next = new Set(get(selectedBookmarkIdsAtom))

    if (!next.delete(id)) {
      next.add(id)
    }

    set(selectedBookmarkIdsAtom, next)
  }
)

export const setBookmarkSelectionAtom = atom(
  null,
  (_get, set, ids: Iterable<string>) => {
    set(selectedBookmarkIdsAtom, new Set(ids))
  }
)

export const clearBookmarkSelectionAtom = atom(null, (_get, set) => {
  set(selectedBookmarkIdsAtom, new Set<string>())
})

export const deselectBookmarksAtom = atom(
  null,
  (get, set, ids: Iterable<string>) => {
    const selected = get(selectedBookmarkIdsAtom)

    if (selected.size === 0) {
      return
    }

    const removed = new Set(ids)

    set(
      selectedBookmarkIdsAtom,
      new Set([...selected].filter((id) => !removed.has(id)))
    )
  }
)

export const deleteDialogAtom = atom<BookmarkDTO[]>([])

export const collectionDeleteDialogAtom = atom<CollectionDTO | null>(null)

export const searchDialogAtom = atom(false)

export const searchQueryAtom = atom("")

const RECENT_SEARCH_LIMIT = 8

export const recentSearchesAtom = atomWithStorage<string[]>(
  "loomark.recent-searches",
  []
)

export const pushRecentSearchAtom = atom(null, (get, set, query: string) => {
  const value = query.trim()

  if (!value) return

  const rest = get(recentSearchesAtom).filter(
    (item) => item.toLowerCase() !== value.toLowerCase()
  )

  set(recentSearchesAtom, [value, ...rest].slice(0, RECENT_SEARCH_LIMIT))
})

export const removeRecentSearchAtom = atom(null, (get, set, query: string) => {
  set(
    recentSearchesAtom,
    get(recentSearchesAtom).filter((item) => item !== query)
  )
})

export const clearRecentSearchesAtom = atom(null, (_get, set) => {
  set(recentSearchesAtom, [])
})

export const gridColumnsPreviewAtom = atom<number | null>(null)

export const openInNewTabAtom = atom(true)

export const serverThemeModeAtom = atom<ThemeMode>("system")

export const bookmarkDialogAtom = atom<BookmarkDialogState>({
  open: false,
  bookmark: null,
  collectionId: null,
})

export const collectionDialogAtom = atom<CollectionDialogState>({
  open: false,
  collection: null,
  parentId: null,
})
