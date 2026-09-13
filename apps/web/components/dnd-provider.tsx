"use client"

import {
  DragDropProvider,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/react"
import { useQueryClient } from "@tanstack/react-query"
import { useStore } from "jotai"
import { useRef } from "react"

import { sortBookmarks } from "@loomark/core/sort"
import type { BookmarkDTO } from "@loomark/core/types"

import { useBookmarkActions } from "@/hooks/use-bookmark-actions"
import { bookmarkListQuery } from "@/lib/client/queries"
import { bookmarkDragGroup, collectionDropData, DRAG_TYPE } from "@/lib/dnd"
import { activeBookmarkQueryAtom, selectedBookmarkIdsAtom } from "@/store/atoms"

const NON_DRAGGABLE = "button, input, textarea, select"

const sensors = [
  PointerSensor.configure({
    preventActivation: (event, source) => {
      if (!(event.target instanceof Element)) {
        return false
      }

      const control = event.target.closest(NON_DRAGGABLE)

      return Boolean(control) && control !== source.element
    },
  }),
  KeyboardSensor,
]

export const DndProvider = ({ children }: { children: React.ReactNode }) => {
  const { moveMany } = useBookmarkActions()
  const store = useStore()
  const queryClient = useQueryClient()
  const dragged = useRef<BookmarkDTO[]>([])

  const draggedBookmarks = (bookmark: BookmarkDTO) => {
    const group = bookmarkDragGroup(
      bookmark.id,
      store.get(selectedBookmarkIdsAtom)
    )
    const query = store.get(activeBookmarkQueryAtom)

    if (!group || !query) {
      return [bookmark]
    }

    const items = queryClient.getQueryData(bookmarkListQuery(query).queryKey)

    return sortBookmarks(items ?? [bookmark], "custom").filter((item) =>
      group.has(item.id)
    )
  }

  const onDragStart = ({ operation: { source } }: DragStartEvent) => {
    const bookmark =
      source?.type === DRAG_TYPE.bookmark
        ? (source.data?.bookmark as BookmarkDTO | undefined)
        : undefined

    dragged.current = bookmark ? draggedBookmarks(bookmark) : []
  }

  const onDragEnd = ({ canceled, operation }: DragEndEvent) => {
    const bookmarks = dragged.current
    dragged.current = []

    const collectionId = collectionDropData(
      operation.target?.data
    )?.collectionId

    if (canceled || !collectionId) {
      return
    }

    moveMany(
      bookmarks.filter((item) => item.collectionId !== collectionId),
      collectionId
    )
  }

  return (
    <DragDropProvider
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {children}
    </DragDropProvider>
  )
}
