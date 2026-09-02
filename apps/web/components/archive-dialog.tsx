"use client"

import { useAtom } from "jotai"
import {
  AlertCircleIcon,
  CameraIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GlobeIcon,
  Loader2Icon,
  RefreshCwIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  ARCHIVE_FORMATS,
  ARCHIVE_LABELS,
  ARCHIVE_SLUGS,
  type ArchiveFormat,
} from "@loomark/core/archive"
import { formatBytes } from "@loomark/core/format"
import { routes } from "@loomark/core/routes"
import type { ArchiveDTO } from "@loomark/core/types"
import { Button } from "@loomark/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@loomark/ui/components/dialog"

import { api } from "@/lib/client-api"
import { archiveDialogAtom } from "@/store/atoms"

const ICONS: Record<ArchiveFormat, typeof CameraIcon> = {
  SCREENSHOT: CameraIcon,
  WEBPAGE: GlobeIcon,
  PDF: FileTextIcon,
  MARKDOWN: FileTextIcon,
}

const POLL_MS = 3000

const isBusy = (archives: ArchiveDTO[]) =>
  archives.some(
    (archive) => archive.status === "PENDING" || archive.status === "RUNNING"
  )

const ArchiveRow = ({
  bookmarkId,
  format,
  archive,
  onRun,
  pending,
}: {
  bookmarkId: string
  format: ArchiveFormat
  archive: ArchiveDTO | undefined
  onRun: (format: ArchiveFormat) => void
  pending: boolean
}) => {
  const Icon = ICONS[format]
  const status = archive?.status
  const running = status === "PENDING" || status === "RUNNING" || pending

  const detail = () => {
    if (pending || status === "PENDING") {
      return "Queued"
    }

    if (status === "RUNNING") {
      return "Capturing…"
    }

    if (status === "READY") {
      return formatBytes(archive?.bytes ?? 0)
    }

    if (status === "FAILED") {
      return archive?.error ?? "Capture failed"
    }

    return "Not archived yet"
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium">{ARCHIVE_LABELS[format]}</span>
          <span
            className={`truncate text-xs ${status === "FAILED" ? "text-destructive" : "text-muted-foreground"}`}
          >
            {detail()}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {status === "FAILED" ? (
          <AlertCircleIcon className="size-4 text-destructive" />
        ) : null}
        {status === "READY" ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Open ${ARCHIVE_LABELS[format]}`}
            render={
              <a
                href={routes.bookmarkArchive(bookmarkId, ARCHIVE_SLUGS[format])}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <ExternalLinkIcon />
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={running}
          aria-label={`Archive ${ARCHIVE_LABELS[format]}`}
          onClick={() => onRun(format)}
        >
          {running ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <RefreshCwIcon />
          )}
        </Button>
      </div>
    </div>
  )
}

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

  const byFormat = new Map(archives.map((archive) => [archive.format, archive]))
  const busy = isBusy(archives) || queued.length > 0

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
            Settings.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {ARCHIVE_FORMATS.map((format) => (
            <ArchiveRow
              key={format}
              bookmarkId={bookmark?.id ?? ""}
              format={format}
              archive={byFormat.get(format)}
              pending={queued.includes(format)}
              onRun={(one) => void run([one])}
            />
          ))}
        </div>
        <Button
          variant="outline"
          className="self-start"
          disabled={busy}
          onClick={() => void run([...ARCHIVE_FORMATS])}
        >
          {busy ? <Loader2Icon className="animate-spin" /> : <RefreshCwIcon />}
          Capture every format
        </Button>
      </DialogContent>
    </Dialog>
  )
}
