import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

import type { SortOrder } from "@/lib/sort"
import type { BookmarkDTO, CollectionDTO } from "@/lib/types"

export type ViewMode = "grid" | "list"

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

export const bookmarkListAtom = atom<BookmarkListState>({
  source: [],
  items: [],
})

export const searchQueryAtom = atom("")

export const searchResultsAtom = atom<BookmarkDTO[] | null>(null)

export const searchPendingAtom = atom(false)

export const viewModeAtom = atomWithStorage<ViewMode>("tana.view-mode", "grid")

export const sortOrderAtom = atomWithStorage<SortOrder>(
  "tana.sort-order",
  "newest"
)

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

export const removeBookmarkAtom = atom(null, (get, set, id: string) => {
  const results = get(searchResultsAtom)

  if (results) {
    set(
      searchResultsAtom,
      results.filter((item) => item.id !== id)
    )
  }

  const list = get(bookmarkListAtom)

  set(bookmarkListAtom, {
    ...list,
    items: list.items.filter((item) => item.id !== id),
  })
})

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
