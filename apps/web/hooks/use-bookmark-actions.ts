"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { errorMessage } from "@loomark/core/format"
import type { BookmarkDTO } from "@loomark/core/types"

import { api } from "@/lib/client/api"
import { invalidateLibrary, upsertBookmarkInCache } from "@/lib/client/queries"

export const useBookmarkActions = () => {
  const queryClient = useQueryClient()

  const applyUpdate = (updated: BookmarkDTO) => {
    upsertBookmarkInCache(queryClient, updated)
    void invalidateLibrary(queryClient)
  }

  const { mutate: togglePin } = useMutation({
    mutationFn: (bookmark: BookmarkDTO) =>
      api.updateBookmark(bookmark.id, { pinned: !bookmark.pinned }),
    onSuccess: (updated) => {
      applyUpdate(updated)
      toast.success(updated.pinned ? "Pinned to homepage" : "Unpinned")
    },
    onError: (cause) => {
      toast.error(errorMessage(cause, "Update failed"))
    },
  })

  const { mutate: moveBookmark } = useMutation({
    mutationFn: ({
      bookmark,
      collectionId,
    }: {
      bookmark: BookmarkDTO
      collectionId: string | null
    }) => api.updateBookmark(bookmark.id, { collectionId }),
    onSuccess: (updated) => {
      applyUpdate(updated)
      toast.success("Bookmark moved")
    },
    onError: (cause) => {
      toast.error(errorMessage(cause, "Move failed"))
    },
  })

  const move = (bookmark: BookmarkDTO, collectionId: string | null) =>
    moveBookmark({ bookmark, collectionId })

  const copyLink = async (bookmark: BookmarkDTO) => {
    try {
      await navigator.clipboard.writeText(bookmark.url)
      toast.success("Link copied")
    } catch {
      toast.error("Could not copy the link")
    }
  }

  return { togglePin, move, copyLink }
}
