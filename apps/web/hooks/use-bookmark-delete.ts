"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSetAtom } from "jotai"
import { toast } from "sonner"

import { errorMessage, plural } from "@loomark/core/format"
import type { BookmarkDTO } from "@loomark/core/types"

import { api } from "@/lib/client/api"
import {
  invalidateLibrary,
  removeBookmarksFromCache,
} from "@/lib/client/queries"
import { clearBookmarkSelectionAtom } from "@/store/atoms"

export const useBookmarkDelete = () => {
  const queryClient = useQueryClient()
  const clearSelection = useSetAtom(clearBookmarkSelectionAtom)

  const { mutate: restore } = useMutation({
    mutationFn: (bookmarks: BookmarkDTO[]) => api.restoreBookmarks(bookmarks),
    onSuccess: (bookmarks) => {
      void invalidateLibrary(queryClient)
      toast.success(`${plural(bookmarks.length, "bookmark")} restored`)
    },
    onError: (cause) => {
      toast.error(errorMessage(cause, "Restore failed"))
    },
  })

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (bookmarks: BookmarkDTO[]) =>
      api.deleteBookmarks(bookmarks.map((bookmark) => bookmark.id)),
    onSuccess: (_result, bookmarks) => {
      removeBookmarksFromCache(
        queryClient,
        bookmarks.map((bookmark) => bookmark.id)
      )
      clearSelection()
      void invalidateLibrary(queryClient)

      toast.success(`${plural(bookmarks.length, "bookmark")} deleted`, {
        action: { label: "Undo", onClick: () => restore(bookmarks) },
      })
    },
    onError: (cause) => {
      toast.error(errorMessage(cause, "Delete failed"))
    },
  })

  const destroy = async (bookmarks: BookmarkDTO[]) => {
    if (bookmarks.length === 0) {
      return
    }

    await mutateAsync(bookmarks).catch(() => null)
  }

  return { destroy, pending: isPending }
}
