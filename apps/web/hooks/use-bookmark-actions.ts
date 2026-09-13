"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSetAtom } from "jotai"
import { toast } from "sonner"

import { errorMessage, plural } from "@loomark/core/format"
import type { BookmarkDTO } from "@loomark/core/types"

import { api } from "@/lib/client/api"
import {
  invalidateLibrary,
  upsertBookmarkInCache,
  upsertBookmarksInCache,
} from "@/lib/client/queries"
import { deselectBookmarksAtom } from "@/store/atoms"

export const useBookmarkActions = () => {
  const queryClient = useQueryClient()
  const deselectBookmarks = useSetAtom(deselectBookmarksAtom)

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

  const { mutate: moveBookmarks } = useMutation({
    mutationFn: ({
      bookmarks,
      collectionId,
    }: {
      bookmarks: BookmarkDTO[]
      collectionId: string | null
    }) =>
      api.moveBookmarks({
        ids: bookmarks.map((bookmark) => bookmark.id),
        collectionId,
      }),
    onSuccess: (updated) => {
      upsertBookmarksInCache(queryClient, updated)
      deselectBookmarks(updated.map((bookmark) => bookmark.id))
      void invalidateLibrary(queryClient)
      toast.success(
        updated.length === 1
          ? "Bookmark moved"
          : `${plural(updated.length, "bookmark")} moved`
      )
    },
    onError: (cause) => {
      toast.error(errorMessage(cause, "Move failed"))
    },
  })

  const moveMany = (bookmarks: BookmarkDTO[], collectionId: string | null) => {
    if (bookmarks.length > 0) {
      moveBookmarks({ bookmarks, collectionId })
    }
  }

  const move = (bookmark: BookmarkDTO, collectionId: string | null) =>
    moveMany([bookmark], collectionId)

  const copyLink = async (bookmark: BookmarkDTO) => {
    try {
      await navigator.clipboard.writeText(bookmark.url)
      toast.success("Link copied")
    } catch {
      toast.error("Could not copy the link")
    }
  }

  return { togglePin, move, moveMany, copyLink }
}
