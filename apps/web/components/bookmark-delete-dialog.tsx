"use client"

import { useAtom } from "jotai"

import { plural } from "@loomark/core/format"
import { hostFromUrl } from "@loomark/core/url"
import { ConfirmDialog } from "@loomark/ui/components/confirm-dialog"

import { useBookmarkDelete } from "@/hooks/use-bookmark-delete"
import { deleteDialogAtom } from "@/store/atoms"

export const BookmarkDeleteDialog = () => {
  const [bookmarks, setBookmarks] = useAtom(deleteDialogAtom)
  const { destroy, pending } = useBookmarkDelete()

  const count = bookmarks.length
  const only = count === 1 ? bookmarks[0] : null

  return (
    <ConfirmDialog
      open={count > 0}
      onOpenChange={(open) => {
        if (!open) {
          setBookmarks([])
        }
      }}
      pending={pending}
      title={
        only ? "Delete this bookmark?" : `Delete ${plural(count, "bookmark")}?`
      }
      description={
        only
          ? `“${only.title?.trim() || hostFromUrl(only.url)}” will be removed.`
          : "They will be removed from every collection they live in. You can undo this from the toast."
      }
      confirmLabel={
        only ? "Delete bookmark" : `Delete ${plural(count, "bookmark")}`
      }
      onConfirm={async () => {
        await destroy(bookmarks)
        setBookmarks([])
      }}
    />
  )
}
