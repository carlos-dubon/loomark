"use client"

import { useAtomValue, useSetAtom } from "jotai"

import type { BookmarkDTO } from "@/lib/types"
import {
  clearBookmarkSelectionAtom,
  selectedBookmarkIdsAtom,
  setBookmarkSelectionAtom,
  toggleBookmarkSelectionAtom,
} from "@/store/atoms"

export const useBookmarkSelection = () => {
  const selected = useAtomValue(selectedBookmarkIdsAtom)
  const replace = useSetAtom(setBookmarkSelectionAtom)
  const clear = useSetAtom(clearBookmarkSelectionAtom)

  const selectAll = (bookmarks: BookmarkDTO[]) =>
    replace(bookmarks.map((bookmark) => bookmark.id))

  return { selected, count: selected.size, selectAll, clear }
}

export const useBookmarkSelected = (id: string) => {
  const selected = useAtomValue(selectedBookmarkIdsAtom)
  const toggle = useSetAtom(toggleBookmarkSelectionAtom)

  return {
    selected: selected.has(id),
    selecting: selected.size > 0,
    toggle,
  }
}
