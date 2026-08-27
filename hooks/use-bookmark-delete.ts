"use client"

import { useSetAtom } from "jotai"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { api } from "@/lib/client-api"
import type { BookmarkDTO } from "@/lib/types"
import {
  clearBookmarkSelectionAtom,
  removeBookmarksAtom,
  restoreBookmarksAtom,
} from "@/store/atoms"

const plural = (count: number) =>
  `${count} ${count === 1 ? "bookmark" : "bookmarks"}`

export const useBookmarkDelete = () => {
  const router = useRouter()
  const removeBookmarks = useSetAtom(removeBookmarksAtom)
  const restoreBookmarks = useSetAtom(restoreBookmarksAtom)
  const clearSelection = useSetAtom(clearBookmarkSelectionAtom)

  const [pending, setPending] = useState(false)

  const undo = async (bookmarks: BookmarkDTO[]) => {
    try {
      restoreBookmarks(await api.restoreBookmarks(bookmarks))
      toast.success(`${plural(bookmarks.length)} restored`)
      router.refresh()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Restore failed")
    }
  }

  const destroy = async (bookmarks: BookmarkDTO[]) => {
    if (bookmarks.length === 0) {
      return
    }

    setPending(true)

    try {
      await api.deleteBookmarks(bookmarks.map((bookmark) => bookmark.id))

      removeBookmarks(bookmarks.map((bookmark) => bookmark.id))
      clearSelection()
      router.refresh()

      toast.success(`${plural(bookmarks.length)} deleted`, {
        action: { label: "Undo", onClick: () => void undo(bookmarks) },
      })
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Delete failed")
    } finally {
      setPending(false)
    }
  }

  return { destroy, pending }
}
