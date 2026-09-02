import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

import {
  DEFAULT_ARCHIVE_SETTINGS,
  type ArchiveSettings,
} from "@loomark/core/archive"
import type { NoiseLevel, SidebarSide } from "@loomark/core/sidebar"
import type { SortOrder } from "@loomark/core/sort"
import type { BookmarkDTO, CollectionDTO } from "@loomark/core/types"
import type { ViewMode } from "@loomark/core/view-mode"

import type { AppearanceDTO } from "@/lib/themes/appearance"
import { DEFAULT_APPEARANCE } from "@/lib/themes/appearance-defaults"

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

type BookmarkListState = {
  source: BookmarkDTO[]
  items: BookmarkDTO[]
}

export const collectionsAtom = atom<CollectionDTO[]>([])

export const appearanceAtom = atom<AppearanceDTO>(DEFAULT_APPEARANCE)

export const themeCssAtom = atom("")

export const fontHrefAtom = atom<string | null>(null)

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

export const deleteDialogAtom = atom<BookmarkDTO[]>([])

export const collectionDeleteDialogAtom = atom<CollectionDTO | null>(null)

export const collectionShareDialogAtom = atom<CollectionDTO | null>(null)

export const archiveDialogAtom = atom<BookmarkDTO | null>(null)

export const archiveSettingsAtom = atom<ArchiveSettings>(
  DEFAULT_ARCHIVE_SETTINGS
)

export const bookmarkListAtom = atom<BookmarkListState>({
  source: [],
  items: [],
})

export const setBookmarkItemsAtom = atom(
  null,
  (get, set, update: (items: BookmarkDTO[]) => BookmarkDTO[]) => {
    const list = get(bookmarkListAtom)

    set(bookmarkListAtom, { ...list, items: update(list.items) })
  }
)

export const searchDialogAtom = atom(false)

export const searchQueryAtom = atom("")

export const searchResultsAtom = atom<BookmarkDTO[] | null>(null)

export const searchPendingAtom = atom(false)

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

export const viewModeAtom = atom<ViewMode>("grid")

export const sortOrderAtom = atom<SortOrder>("newest")

export const sidebarSideAtom = atom<SidebarSide>("left")

export const sidebarNoiseAtom = atom<NoiseLevel>("off")

export const openInNewTabAtom = atom(true)

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

export const upsertBookmarkAtom = atom(
  null,
  (get, set, bookmark: BookmarkDTO) => {
    const results = get(searchResultsAtom)

    if (results) {
      set(
        searchResultsAtom,
        results.some((item) => item.id === bookmark.id)
          ? results.map((item) => (item.id === bookmark.id ? bookmark : item))
          : [bookmark, ...results]
      )
    }

    const list = get(bookmarkListAtom)

    if (list.items.some((item) => item.id === bookmark.id)) {
      set(bookmarkListAtom, {
        ...list,
        items: list.items.map((item) =>
          item.id === bookmark.id ? bookmark : item
        ),
      })
    }
  }
)

export const removeBookmarksAtom = atom(
  null,
  (get, set, ids: Iterable<string>) => {
    const removed = new Set(ids)
    const results = get(searchResultsAtom)

    if (results) {
      set(
        searchResultsAtom,
        results.filter((item) => !removed.has(item.id))
      )
    }

    const list = get(bookmarkListAtom)

    set(bookmarkListAtom, {
      ...list,
      items: list.items.filter((item) => !removed.has(item.id)),
    })

    const selected = get(selectedBookmarkIdsAtom)

    if (selected.size > 0) {
      set(
        selectedBookmarkIdsAtom,
        new Set([...selected].filter((id) => !removed.has(id)))
      )
    }
  }
)

export const restoreBookmarksAtom = atom(
  null,
  (get, set, bookmarks: BookmarkDTO[]) => {
    const results = get(searchResultsAtom)

    if (results) {
      const known = new Set(results.map((item) => item.id))

      set(searchResultsAtom, [
        ...bookmarks.filter((item) => !known.has(item.id)),
        ...results,
      ])
    }

    const list = get(bookmarkListAtom)
    const known = new Set(list.items.map((item) => item.id))

    set(bookmarkListAtom, {
      ...list,
      items: [
        ...bookmarks.filter((item) => !known.has(item.id)),
        ...list.items,
      ],
    })
  }
)

export const upsertCollectionAtom = atom(
  null,
  (get, set, collection: CollectionDTO) => {
    const collections = get(collectionsAtom)

    set(
      collectionsAtom,
      collections.some((item) => item.id === collection.id)
        ? collections.map((item) =>
            item.id === collection.id ? collection : item
          )
        : [...collections, collection]
    )
  }
)

export const setCollectionShareAtom = atom(
  null,
  (get, set, id: string, shareToken: string | null) => {
    set(
      collectionsAtom,
      get(collectionsAtom).map((collection) =>
        collection.id === id ? { ...collection, shareToken } : collection
      )
    )
  }
)

export const removeCollectionAtom = atom(null, (get, set, id: string) => {
  const remaining = get(collectionsAtom).filter((item) => item.id !== id)
  const removed = new Set([id])
  let changed = true

  while (changed) {
    changed = false

    for (const collection of remaining) {
      if (
        collection.parentId &&
        removed.has(collection.parentId) &&
        !removed.has(collection.id)
      ) {
        removed.add(collection.id)
        changed = true
      }
    }
  }

  set(
    collectionsAtom,
    remaining.filter((collection) => !removed.has(collection.id))
  )
})
