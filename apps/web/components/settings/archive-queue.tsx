"use client"

import { ExternalLinkIcon, XIcon } from "lucide-react"

import {
  ARCHIVE_QUEUE_GROUPS,
  archiveProgress,
  type ArchiveFormat,
} from "@loomark/core/archive"
import type { ArchiveQueueGroup } from "@loomark/core/types"
import { Button } from "@loomark/ui/components/button"
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
} from "@loomark/ui/components/progress"

import { ArchiveJob } from "@/components/archives/archive-job"
import { FaviconImage } from "@/components/favicon-image"
import { SettingsCard } from "@/components/settings/settings-page"
import { useArchiveQueue } from "@/hooks/use-archive-queue"
import { useStageClock } from "@/hooks/use-stage-clock"

const plural = (count: number, word: string) =>
  `${count} ${count === 1 ? word : `${word}s`}`

const stageSignature = (group: ArchiveQueueGroup) =>
  group.archives
    .map((archive) => `${archive.status}:${archive.stage}`)
    .join("|")

const groupProgress = (group: ArchiveQueueGroup, elapsed: number) =>
  group.archives.reduce(
    (total, archive) =>
      total + archiveProgress(archive.status, archive.stage, elapsed),
    0
  ) / Math.max(group.archives.length, 1)

const QueueGroup = ({
  group,
  onCancel,
}: {
  group: ArchiveQueueGroup
  onCancel: (bookmarkId: string, formats?: ArchiveFormat[]) => void
}) => {
  const elapsed = useStageClock(stageSignature(group), true)

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <FaviconImage src={group.faviconUrl} className="size-5 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-sm font-medium">{group.title}</span>
            <Progress value={groupProgress(group, elapsed)} className="gap-1">
              <ProgressTrack>
                <ProgressIndicator />
              </ProgressTrack>
              <ProgressLabel className="truncate">{group.url}</ProgressLabel>
            </Progress>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open the page"
            render={
              <a href={group.url} target="_blank" rel="noopener noreferrer" />
            }
          >
            <ExternalLinkIcon />
          </Button>
          <Button
            variant="ghost-muted"
            size="icon-sm"
            aria-label={`Cancel every capture for ${group.title}`}
            onClick={() => onCancel(group.bookmarkId)}
          >
            <XIcon />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {group.archives.map((archive) => (
          <ArchiveJob
            key={archive.format}
            bookmarkId={group.bookmarkId}
            format={archive.format}
            archive={archive}
            onCancel={(format) => onCancel(group.bookmarkId, [format])}
          />
        ))}
      </div>
    </div>
  )
}

export const ArchiveQueue = () => {
  const { queue, busy, canceling, cancelAll, cancelBookmark } =
    useArchiveQueue()

  if (!busy) {
    return null
  }

  const hidden = queue.bookmarks - queue.groups.length

  return (
    <SettingsCard
      title="Queue"
      description="What the archiver is working on right now, grouped by bookmark. Every capture opens the page once and then saves each format from it, so the formats under a bookmark move together until the last one is written. Cancel a single format, a whole bookmark, or the rest of the queue; anything already saved to disk is kept."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {plural(queue.running, "capture")} running,{" "}
            {plural(queue.pending, "capture")} waiting across{" "}
            {plural(queue.bookmarks, "bookmark")}.
          </span>
          <Button
            variant="destructive-outline"
            size="sm"
            disabled={canceling}
            onClick={() => void cancelAll()}
          >
            <XIcon />
            Cancel everything
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {queue.groups.map((group) => (
            <QueueGroup
              key={group.bookmarkId}
              group={group}
              onCancel={(bookmarkId, formats) =>
                void cancelBookmark(bookmarkId, formats)
              }
            />
          ))}
        </div>
        {hidden > 0 ? (
          <span className="text-xs text-muted-foreground">
            Showing the first {ARCHIVE_QUEUE_GROUPS} bookmarks.{" "}
            {plural(hidden, "more bookmark")} still queued behind them.
          </span>
        ) : null}
      </div>
    </SettingsCard>
  )
}
