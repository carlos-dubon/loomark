"use client"

import {
  AlertCircleIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  ARCHIVE_LABELS,
  ARCHIVE_SLUGS,
  ARCHIVE_STAGE_LABELS,
  archiveProgress,
  isArchiveActive,
  type ArchiveFormat,
} from "@loomark/core/archive"
import { formatBytes } from "@loomark/core/format"
import { routes } from "@loomark/core/routes"
import type { ArchiveDTO } from "@loomark/core/types"
import { cn } from "@loomark/core/utils"
import { Button } from "@loomark/ui/components/button"
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
} from "@loomark/ui/components/progress"

import { ArchiveFormatIcon } from "@/components/archives/archive-format-icon"
import { isDemo } from "@/lib/demo/config"
import { useStageClock } from "@/hooks/use-stage-clock"

const detail = (archive: ArchiveDTO | undefined, queued: boolean) => {
  if (queued || archive?.status === "PENDING") {
    return "Waiting in the queue"
  }

  if (archive?.status === "RUNNING") {
    return archive.stage
      ? ARCHIVE_STAGE_LABELS[archive.stage]
      : "Picked up by the worker"
  }

  if (archive?.status === "READY") {
    return formatBytes(archive.bytes)
  }

  if (archive?.status === "FAILED") {
    return archive.error ?? "Capture failed"
  }

  return "Not archived yet"
}

export const ArchiveJob = ({
  bookmarkId,
  format,
  archive,
  queued = false,
  onRun,
  onCancel,
  className,
}: {
  bookmarkId: string
  format: ArchiveFormat
  archive: ArchiveDTO | undefined
  queued?: boolean
  onRun?: (format: ArchiveFormat) => void
  onCancel?: (format: ArchiveFormat) => void
  className?: string
}) => {
  const status = archive?.status
  const active = queued || (status !== undefined && isArchiveActive(status))
  const failed = status === "FAILED"
  const elapsed = useStageClock(
    `${queued}:${status ?? "NEW"}:${archive?.stage}`,
    active
  )
  const progress =
    archive && !queued
      ? archiveProgress(archive.status, archive.stage, elapsed)
      : archiveProgress("PENDING", null, elapsed)

  return (
    <div
      data-slot="archive-job"
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <ArchiveFormatIcon format={format} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm font-medium">{ARCHIVE_LABELS[format]}</span>
          {active ? (
            <Progress value={progress} className="gap-1">
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
              <ProgressLabel className="truncate">
                {detail(archive, queued)}
              </ProgressLabel>
            </Progress>
          ) : (
            <span
              className={cn(
                "truncate text-xs",
                failed ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {detail(archive, queued)}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {failed ? (
          <AlertCircleIcon className="size-4 text-destructive" />
        ) : null}
        {status === "READY" ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Open ${ARCHIVE_LABELS[format]}`}
            {...(isDemo
              ? {
                  onClick: () =>
                    toast.info(
                      "The demo captures nothing for real, so there is no file to open. Self-hosted Loomark saves it to disk."
                    ),
                }
              : {
                  render: (
                    <a
                      href={routes.bookmarkArchive(
                        bookmarkId,
                        ARCHIVE_SLUGS[format]
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ),
                })}
          >
            <ExternalLinkIcon />
          </Button>
        ) : null}
        {active && onCancel ? (
          <Button
            variant="ghost-muted"
            size="icon-sm"
            aria-label={`Cancel ${ARCHIVE_LABELS[format]}`}
            onClick={() => onCancel(format)}
          >
            <XIcon />
          </Button>
        ) : null}
        {onRun ? (
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={active}
            aria-label={`Archive ${ARCHIVE_LABELS[format]}`}
            onClick={() => onRun(format)}
          >
            <RefreshCwIcon />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
