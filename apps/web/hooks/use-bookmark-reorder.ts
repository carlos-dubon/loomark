"use client"

import { move } from "@dnd-kit/helpers"
import { useDragDropMonitor } from "@dnd-kit/react"
import { isSortable } from "@dnd-kit/react/sortable"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { DRAG_TYPE } from "@/lib/dnd"
import type { BookmarkQuery } from "@/lib/query-keys"

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

      const items = queryClient.getQueryData(queryKey) ?? previous

      save({
        ids: sortBookmarks(items, "custom", scope).map(
          (bookmark) => bookmark.id
        ),
        previous,
      })
    },
  })
}
