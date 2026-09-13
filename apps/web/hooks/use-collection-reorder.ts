"use client"

import { move } from "@dnd-kit/helpers"
import { useDragDropMonitor } from "@dnd-kit/react"
import { isSortable } from "@dnd-kit/react/sortable"
import { useQueryClient } from "@tanstack/react-query"
import { useRef } from "react"

import { applyCollectionMove, siblingsOf } from "@loomark/core/tree"
import type { CollectionDTO } from "@loomark/core/types"

import { useMoveCollection } from "@/hooks/use-collection-actions"
import { collectionsQuery } from "@/lib/client/queries"
import {
  collectionCardId,
  collectionSourceId,
  DRAG_TYPE,
  isCollectionCardId,
} from "@/lib/dnd"

export const useCollectionReorder = (parentId: string | null) => {
  const queryClient = useQueryClient()
  const { mutate: save } = useMoveCollection("Could not save the order")
  const { queryKey } = collectionsQuery
  const before = useRef<CollectionDTO[] | null>(null)

  useDragDropMonitor({
    onDragStart: (event) => {
      before.current = null

      if (event.operation.source?.type === DRAG_TYPE.collectionCard) {
        void queryClient.cancelQueries({ queryKey })
      }
    },
    onDragOver: (event) => {
      const { source, target } = event.operation
      const collections = queryClient.getQueryData(queryKey)
      const id =
        source?.type === DRAG_TYPE.collectionCard
          ? collectionSourceId(source)
          : null

      if (
        !id ||
        !collections ||
        !isSortable(target) ||
        !isCollectionCardId(target.id)
      ) {
        return
      }

      const ids = siblingsOf(collections, parentId).map((collection) =>
        collectionCardId(collection.id)
      )

      if (!ids.includes(collectionCardId(id))) {
        return
      }

      const index = move(ids, event).indexOf(collectionCardId(id))

      if (index === -1) {
        return
      }

      before.current ??= collections

      queryClient.setQueryData(
        queryKey,
        applyCollectionMove(collections, id, parentId, index)
      )
    },
    onDragEnd: (event) => {
      const previous = before.current
      before.current = null

      if (!previous) {
        return
      }

      const { source, target } = event.operation
      const id = source ? collectionSourceId(source) : null

      if (
        event.canceled ||
        !isSortable(target) ||
        !isCollectionCardId(target.id) ||
        !id
      ) {
        queryClient.setQueryData(queryKey, previous)
        return
      }

      const collections = queryClient.getQueryData(queryKey) ?? previous
      const index = siblingsOf(collections, parentId).findIndex(
        (collection) => collection.id === id
      )

      if (index !== -1) {
        save({ input: { id, parentId, index }, previous })
      }
    },
  })
}
