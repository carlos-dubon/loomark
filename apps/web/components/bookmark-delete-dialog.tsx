"use client"

import { useAtom } from "jotai"
import { Loader2Icon, Trash2Icon } from "lucide-react"

import { hostFromUrl } from "@loomark/core/url"
import { Button } from "@loomark/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@loomark/ui/components/dialog"

import { useBookmarkDelete } from "@/hooks/use-bookmark-delete"
import { deleteDialogAtom } from "@/store/atoms"

export const BookmarkDeleteDialog = () => {
  const [bookmarks, setBookmarks] = useAtom(deleteDialogAtom)
  const { destroy, pending } = useBookmarkDelete()

  const count = bookmarks.length
  const only = count === 1 ? bookmarks[0] : null

  return (
    <Dialog
      open={count > 0}
      onOpenChange={(open) => {
        if (!open && !pending) {
          setBookmarks([])
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {only ? "Delete this bookmark?" : `Delete ${count} bookmarks?`}
          </DialogTitle>
          <DialogDescription>
            {only ? (
              <>
                “{only.title?.trim() || hostFromUrl(only.url)}” will be removed.
                You can undo this from the toast.
              </>
            ) : (
              <>
                They will be removed from every collection they live in. You can
                undo this from the toast.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={pending} />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={async () => {
              await destroy(bookmarks)
              setBookmarks([])
            }}
          >
            {pending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <Trash2Icon />
            )}
            {only ? "Delete bookmark" : `Delete ${count} bookmarks`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
