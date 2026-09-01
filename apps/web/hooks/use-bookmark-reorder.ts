"use client"

import { move } from "@dnd-kit/helpers"
import { useDragDropMonitor } from "@dnd-kit/react"
import { isSortable } from "@dnd-kit/react/sortable"
import { useSetAtom } from "jotai"
import { useRouter } from "next/navigation"
import { useRef } from "react"
import { toast } from "sonner"

import {
  applyManualOrder,
  sortBookmarks,
  type OrderScope,
} from "@loomark/core/sort"
import type { BookmarkDTO } from "@loomark/core/types"

import { api } from "@/lib/client-api"
import { DRAG_TYPE } from "@/lib/dnd"
import { setBookmarkItemsAtom } from "@/store/atoms"

export const useBookmarkReorder = ({
  scope,
  collectionId,
  enabled,
}: {
  scope: OrderScope
  collectionId: string | null
  enabled: boolean
}) => {
  const router = useRouter()
  const setItems = useSetAtom(setBookmarkItemsAtom)
  const before = useRef<BookmarkDTO[] | null>(null)

  const save = async (ordered: BookmarkDTO[], previous: BookmarkDTO[]) => {
    try {
      await api.reorderBookmarks({
        scope,
        collectionId,
        ids: ordered.map((bookmark) => bookmark.id),
      })
      router.refresh()
    } catch (cause) {
      setItems(() => previous)
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

      if (
        !enabled ||
        source?.type !== DRAG_TYPE.bookmark ||
        !isSortable(target)
      ) {
        return
      }

      setItems((items) => {
        before.current ??= items

        return applyManualOrder(
          move(sortBookmarks(items, "custom", scope), event),
          scope
        )
      })
    },
    onDragEnd: (event) => {
      const previous = before.current
      before.current = null

      if (!previous) {
        return
      }

      if (event.canceled || !isSortable(event.operation.target)) {
        setItems(() => previous)
        return
      }

      setItems((items) => {
        void save(sortBookmarks(items, "custom", scope), previous)

        return items
      })
    },
  })
}
