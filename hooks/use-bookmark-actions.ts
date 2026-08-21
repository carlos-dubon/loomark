"use client"

import { useSetAtom } from "jotai"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { api } from "@/lib/client-api"
import type { BookmarkDTO } from "@/lib/types"
import { removeBookmarkAtom, upsertBookmarkAtom } from "@/store/atoms"

export const useBookmarkActions = () => {
  const router = useRouter()
  const upsertBookmark = useSetAtom(upsertBookmarkAtom)
  const removeBookmark = useSetAtom(removeBookmarkAtom)

  const togglePin = async (bookmark: BookmarkDTO) => {
    try {
      const updated = await api.updateBookmark(bookmark.id, {
        pinned: !bookmark.pinned,
      })
      upsertBookmark(updated)
      toast.success(updated.pinned ? "Pinned to homepage" : "Unpinned")
      router.refresh()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Update failed")
    }
  }

  const move = async (bookmark: BookmarkDTO, collectionId: string | null) => {
    try {
      const updated = await api.updateBookmark(bookmark.id, { collectionId })
      upsertBookmark(updated)
      toast.success("Bookmark moved")
      router.refresh()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Move failed")
    }
  }

  const destroy = async (bookmark: BookmarkDTO) => {
    try {
      await api.deleteBookmark(bookmark.id)
      removeBookmark(bookmark.id)
      toast.success("Bookmark deleted")
      router.refresh()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Delete failed")
    }
  }

  const copyLink = async (bookmark: BookmarkDTO) => {
    try {
      await navigator.clipboard.writeText(bookmark.url)
      toast.success("Link copied")
    } catch {
      toast.error("Could not copy the link")
    }
  }

  return { togglePin, move, destroy, copyLink }
}
