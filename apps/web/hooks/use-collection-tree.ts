"use client"

import { move } from "@dnd-kit/helpers"
import { useDragDropMonitor } from "@dnd-kit/react"
import { isSortable } from "@dnd-kit/react/sortable"
import { useRef, useState } from "react"

import {
  collectDescendantIds,
  projectDepth,
  type FlatCollection,
} from "@loomark/core/tree"

import { useCollectionActions } from "@/hooks/use-collection-actions"
import { useCollectionItems } from "@/hooks/use-collection-items"
import { DRAG_TYPE, TREE_INDENT } from "@/lib/dnd"

const dragDepth = (offset: number) => Math.round(offset / TREE_INDENT)

export const useCollectionTree = () => {
  const { items } = useCollectionItems()
  const { move: moveCollection } = useCollectionActions()
  const [preview, setPreview] = useState<FlatCollection[] | null>(null)
  const rows = useRef<FlatCollection[] | null>(null)
  const initialDepth = useRef(0)

  const update = (next: FlatCollection[] | null) => {
    rows.current = next
    setPreview(next)
  }

  const project = (list: FlatCollection[], targetId: string, offset: number) =>
    projectDepth(list, targetId, initialDepth.current + dragDepth(offset))

  useDragDropMonitor({
    onDragStart: (event) => {
      const { source } = event.operation

      if (source?.type !== DRAG_TYPE.collection) {
        return
      }

      const id = String(source.id)
      const dragged = items.find((item) => item.id === id)

      if (!dragged) {
        return
      }

      const descendants = new Set(collectDescendantIds(items, id))
      descendants.delete(id)
      initialDepth.current = dragged.depth

      update(items.filter((item) => !descendants.has(item.id)))
    },
    onDragOver: (event, manager) => {
      const { source, target } = event.operation
      const list = rows.current

      if (!list || !source || !isSortable(target) || source.id === target.id) {
        return
      }

      event.preventDefault()

      const { depth, parentId } = project(
        list,
        String(target.id),
        manager.dragOperation.transform.x
      )

      update(
        move(list, event).map((item) =>
          item.id === String(source.id) ? { ...item, depth, parentId } : item
        )
      )
    },
    onDragMove: (event, manager) => {
      const { source } = event.operation
      const list = rows.current

      if (event.defaultPrevented || !list || !source) {
        return
      }

      const id = String(source.id)
      const current = list.find((item) => item.id === id)

      if (!current) {
        return
      }

      const { depth, parentId } = project(
        list,
        id,
        manager.dragOperation.transform.x
      )

      if (current.depth === depth && current.parentId === parentId) {
        return
      }

      update(
        list.map((item) =>
          item.id === id ? { ...item, depth, parentId } : item
        )
      )
    },
    onDragEnd: (event) => {
      const list = rows.current
      const { source } = event.operation

      if (!list || !source) {
        return
      }

      update(null)

      if (event.canceled) {
        return
      }

      const id = String(source.id)
      const index = list.findIndex((item) => item.id === id)
      const dragged = list[index]

      if (!dragged) {
        return
      }

      const before = list
        .slice(index + 1)
        .find((item) => item.parentId === dragged.parentId)

      void moveCollection(id, dragged.parentId, before?.id ?? null)
    },
  })

  return { rows: preview ?? items }
}
