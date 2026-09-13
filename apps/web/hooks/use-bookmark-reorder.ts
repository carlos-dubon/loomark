"use client"

import { move } from "@dnd-kit/helpers"
import { useDragDropMonitor } from "@dnd-kit/react"
import { isSortable } from "@dnd-kit/react/sortable"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useStore } from "jotai"
import { useRef } from "react"
import { toast } from "sonner"

import { errorMessage } from "@loomark/core/format"
import {
  applyManualOrder,
  sortBookmarks,
  type OrderScope,
} from "@loomark/core/sort"
import type { BookmarkDTO } from "@loomark/core/types"

import { api } from "@/lib/client/api"
import { bookmarkListQuery } from "@/lib/client/queries"
import { bookmarkDragGroup, DRAG_TYPE, gatherGroup } from "@/lib/dnd"
import type { BookmarkQuery } from "@/lib/query-keys"
import { selectedBookmarkIdsAtom } from "@/store/atoms"

type ReorderVariables = {
  ids: string[]
  previous: BookmarkDTO[]
}

export const useBookmarkReorder = ({
  query,
  scope,
  collectionId,
  enabled,
}: {
  query: BookmarkQuery
  scope: OrderScope
  collectionId: string | null
  enabled: boolean
}) => {
  const queryClient = useQueryClient()
  const store = useStore()
  const { queryKey } = bookmarkListQuery(query)
  const before = useRef<BookmarkDTO[] | null>(null)

  const { mutate: save } = useMutation({
    mutationFn: ({ ids }: ReorderVariables) =>
      api.reorderBookmarks({ scope, collectionId, ids }),
    onError: (cause, { previous }) => {
      queryClient.setQueryData(queryKey, previous)
      toast.error(errorMessage(cause, "Could not save the order"))
    },
  })

  useDragDropMonitor({
    onDragStart: (event) => {
      before.current = null

      if (enabled && event.operation.source?.type === DRAG_TYPE.bookmark) {
        void queryClient.cancelQueries({ queryKey })
      }
    },
    onDragOver: (event) => {
      const { source, target } = event.operation
      const items = queryClient.getQueryData(queryKey)

      if (
        !enabled ||
        !items ||
        source?.type !== DRAG_TYPE.bookmark ||
        !isSortable(target)
      ) {
        return
      }

      before.current ??= items

      queryClient.setQueryData(
        queryKey,
        applyManualOrder(
          move(sortBookmarks(items, "custom", scope), event),
          scope
        )
      )
    },
    onDragEnd: (event) => {
      const previous = before.current
      before.current = null

      if (!previous) {
        return
      }

      if (event.canceled || !isSortable(event.operation.target)) {
        queryClient.setQueryData(queryKey, previous)
        return
      }

      const { source } = event.operation
      const items = sortBookmarks(
        queryClient.getQueryData(queryKey) ?? previous,
        "custom",
        scope
      )
      const group = source
        ? bookmarkDragGroup(source.id, store.get(selectedBookmarkIdsAtom))
        : null

      const ordered =
        source && group
          ? gatherGroup(
              items,
              String(source.id),
              sortBookmarks(previous, "custom", scope).filter((bookmark) =>
                group.has(bookmark.id)
              )
            )
          : items

      if (group) {
        queryClient.setQueryData(queryKey, applyManualOrder(ordered, scope))
      }

      save({
        ids: ordered.map((bookmark) => bookmark.id),
        previous,
      })
    },
  })
}
