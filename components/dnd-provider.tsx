"use client"

import {
  DragDropProvider,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
} from "@dnd-kit/react"

import { useBookmarkActions } from "@/hooks/use-bookmark-actions"
import { useCollectionActions } from "@/hooks/use-collection-actions"
import { DRAG_TYPE, dropTargetData } from "@/lib/dnd"
import type { BookmarkDTO } from "@/lib/types"

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
  const { move: moveCollection } = useCollectionActions()

  const onDragEnd = ({ canceled, operation }: DragEndEvent) => {
    const { source, target } = operation

    if (canceled || !source || !target) {
      return
    }

    const drop = dropTargetData(target.data)

    if (!drop) {
      return
    }

    if (source.type === DRAG_TYPE.bookmark) {
      const bookmark = source.data?.bookmark as BookmarkDTO | undefined

      if (
        !bookmark ||
        drop.zone !== "into" ||
        !drop.collectionId ||
        bookmark.collectionId === drop.collectionId
      ) {
        return
      }

      moveBookmark(bookmark, drop.collectionId)
      return
    }

    if (source.type !== DRAG_TYPE.collection) {
      return
    }

    const id = String(source.id)

    if (drop.zone === "root") {
      moveCollection(id, null, null)
      return
    }

    if (drop.zone === "into") {
      if (drop.collectionId) {
        moveCollection(id, drop.collectionId, null)
      }
      return
    }

    if (drop.collectionId) {
      moveCollection(id, drop.parentId ?? null, drop.collectionId)
    }
  }

  return (
    <DragDropProvider sensors={sensors} onDragEnd={onDragEnd}>
      {children}
    </DragDropProvider>
  )
}
