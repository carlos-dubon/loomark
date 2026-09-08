"use client"

import { move } from "@dnd-kit/helpers"
import { useDragDropMonitor } from "@dnd-kit/react"
import { isSortable } from "@dnd-kit/react/sortable"
import { useSetAtom } from "jotai"
import { useRouter } from "next/navigation"
import { useRef } from "react"
import { toast } from "sonner"

import { applyCollectionMove, siblingsOf } from "@loomark/core/tree"
import type { CollectionDTO } from "@loomark/core/types"

import { api } from "@/lib/client-api"
import {
  collectionCardId,
  collectionSourceId,
  DRAG_TYPE,
  isCollectionCardId,
} from "@/lib/dnd"
import { collectionsAtom } from "@/store/atoms"

export const useCollectionReorder = (parentId: string | null) => {
  const router = useRouter()
  const setCollections = useSetAtom(collectionsAtom)
  const before = useRef<CollectionDTO[] | null>(null)

  const save = async (id: string, index: number, previous: CollectionDTO[]) => {
    try {
      setCollections(await api.moveCollection({ id, parentId, index }))
      router.refresh()
    } catch (cause) {
      setCollections(previous)
      toast.error(
        cause instanceof Error ? cause.message : "Could not save the order"
      )
    }
  }

  useDragDropMonitor({
    onDragStart: () => {
      before.current = null
    },
    onDragOver: (event) => {
      const { source, target } = event.operation
      const id =
        source?.type === DRAG_TYPE.collectionCard
          ? collectionSourceId(source)
          : null

      if (!id || !isSortable(target) || !isCollectionCardId(target.id)) {
        return
      }

      setCollections((collections) => {
        const ids = siblingsOf(collections, parentId).map((collection) =>
          collectionCardId(collection.id)
        )

        if (!ids.includes(collectionCardId(id))) {
          return collections
        }

        const index = move(ids, event).indexOf(collectionCardId(id))

        if (index === -1) {
          return collections
        }

        before.current ??= collections

        return applyCollectionMove(collections, id, parentId, index)
      })
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
        setCollections(previous)
        return
      }

      setCollections((collections) => {
        const index = siblingsOf(collections, parentId).findIndex(
          (collection) => collection.id === id
        )

        if (index !== -1) {
          void save(id, index, previous)
        }

        return collections
      })
    },
  })
}
