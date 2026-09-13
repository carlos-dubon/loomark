"use client"

import { useDragOperation } from "@dnd-kit/react"
import { useAtomValue, useSetAtom } from "jotai"

import type { BookmarkDTO } from "@loomark/core/types"

import { bookmarkDragGroup, DRAG_TYPE } from "@/lib/dnd"
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
  const { source } = useDragOperation()

  const dragGroup =
    source?.type === DRAG_TYPE.bookmark
      ? bookmarkDragGroup(source.id, selected)
      : null

  return {
    selected: selected.has(id),
    selecting: selected.size > 0,
    dragGroup,
    toggle,
  }
}
