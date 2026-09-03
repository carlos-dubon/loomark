"use client"

import { useAtom } from "jotai"
import { Loader2Icon, Trash2Icon } from "lucide-react"

import { formatBytes } from "@loomark/core/format"
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

import { useArchiveUsage } from "@/hooks/use-archive-settings"
import { archiveClearDialogAtom } from "@/store/atoms"

export const ArchiveClearDialog = () => {
  const [open, setOpen] = useAtom(archiveClearDialogAtom)
  const { usage, clear, clearing } = useArchiveUsage()

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!clearing) {
          setOpen(next)
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Clear every archive?</DialogTitle>
          <DialogDescription>
            {usage.archives === 1 ? "1 archive" : `${usage.archives} archives`}{" "}
            and the {formatBytes(usage.bytes)} they take up on disk are deleted.
            Your bookmarks stay, but their saved copies are gone and this cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={clearing} />}
          >
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            disabled={clearing}
            onClick={async () => {
              await clear()
              setOpen(false)
            }}
          >
            {clearing ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <Trash2Icon />
            )}
            Clear archives
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
