"use client"

import {
  DragDropProvider,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
} from "@dnd-kit/react"

import type { BookmarkDTO } from "@loomark/core/types"

import { useBookmarkActions } from "@/hooks/use-bookmark-actions"
import { collectionDropData, DRAG_TYPE } from "@/lib/dnd"

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
  const { move: moveBookmark } = useBookmarkActions()

  const onDragEnd = ({ canceled, operation }: DragEndEvent) => {
    const { source, target } = operation

    if (canceled || source?.type !== DRAG_TYPE.bookmark || !target) {
      return
    }

    const bookmark = source.data?.bookmark as BookmarkDTO | undefined
    const collectionId = collectionDropData(target.data)?.collectionId

    if (!bookmark || !collectionId || bookmark.collectionId === collectionId) {
      return
    }

    moveBookmark(bookmark, collectionId)
  }

  return (
    <DragDropProvider sensors={sensors} onDragEnd={onDragEnd}>
      {children}
    </DragDropProvider>
  )
}
