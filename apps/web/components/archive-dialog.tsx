"use client"

import { useAtom } from "jotai"
import { RefreshCwIcon, XIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  ARCHIVE_FORMATS,
  isArchiveActive,
  type ArchiveFormat,
} from "@loomark/core/archive"
import type { ArchiveDTO } from "@loomark/core/types"
import { Button } from "@loomark/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@loomark/ui/components/dialog"

import { ArchiveJob } from "@/components/archives/archive-job"
import { api } from "@/lib/client-api"
import { archiveDialogAtom } from "@/store/atoms"

const POLL_MS = 2000

export const ArchiveDialog = () => {
  const [bookmark, setBookmark] = useAtom(archiveDialogAtom)
  const [archives, setArchives] = useState<ArchiveDTO[]>([])
  const [queued, setQueued] = useState<ArchiveFormat[]>([])
  const bookmarkId = bookmark?.id ?? null

  const close = () => {
    setBookmark(null)
    setArchives([])
    setQueued([])
  }

  useEffect(() => {
    if (!bookmarkId) {
      return
    }

    const controller = new AbortController()
    let cancelled = false

    const poll = async () => {
      try {
        const next = await api.listArchives(bookmarkId, controller.signal)

        if (!cancelled) {
          setArchives(next)
          setQueued([])
        }
      } catch {
        return
      }
    }

    const timer = setInterval(() => void poll(), POLL_MS)

    void poll()

    return () => {
      cancelled = true
      controller.abort()
      clearInterval(timer)
    }
  }, [bookmarkId])

  const run = async (formats: ArchiveFormat[]) => {
    if (!bookmarkId) {
      return
    }

    setQueued(formats)

    try {
      setArchives(await api.runArchives(bookmarkId, { formats }))
    } catch (cause) {
      setQueued([])
      toast.error(cause instanceof Error ? cause.message : "Could not queue")
    }
  }

  const cancel = async (formats?: ArchiveFormat[]) => {
    if (!bookmarkId) {
      return
    }

    setQueued([])

    try {
      setArchives(await api.cancelArchives(bookmarkId, formats))
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not cancel")
    }
  }

  const byFormat = new Map(archives.map((archive) => [archive.format, archive]))
  const busy =
    queued.length > 0 ||
    archives.some((archive) => isArchiveActive(archive.status))

  return (
    <Dialog
      open={bookmark !== null}
      onOpenChange={(open) => {
        if (!open) {
          close()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="truncate">
            Archived copies of “{bookmark?.title}”
          </DialogTitle>
          <DialogDescription>
            Loomark keeps its own copy of the page so the bookmark survives the
            link rotting. Which formats it captures automatically is set under
            Settings, and anything still running can be canceled from here.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {ARCHIVE_FORMATS.map((format) => (
            <ArchiveJob
              key={format}
              bookmarkId={bookmark?.id ?? ""}
              format={format}
              archive={byFormat.get(format)}
              queued={queued.includes(format)}
              onRun={(one) => void run([one])}
              onCancel={(one) => void cancel([one])}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void run([...ARCHIVE_FORMATS])}
          >
            <RefreshCwIcon />
            Capture every format
          </Button>
          {busy ? (
            <Button variant="destructive-outline" onClick={() => void cancel()}>
              <XIcon />
              Cancel
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
