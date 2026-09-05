"use client"

import { useSetAtom } from "jotai"
import { HardDriveIcon, Loader2Icon, Trash2Icon } from "lucide-react"

import {
  ARCHIVE_DESCRIPTIONS,
  ARCHIVE_FORMATS,
  ARCHIVE_LABELS,
  ARCHIVE_SLUGS,
} from "@loomark/core/archive"
import { formatBytes } from "@loomark/core/format"
import { Button } from "@loomark/ui/components/button"
import { Label } from "@loomark/ui/components/label"
import { Switch } from "@loomark/ui/components/switch"

import { ArchiveFormatIcon } from "@/components/archives/archive-format-icon"
import {
  useArchiveSettings,
  useArchiveUsage,
} from "@/hooks/use-archive-settings"
import { archiveClearDialogAtom } from "@/store/atoms"

const Usage = () => {
  const { usage } = useArchiveUsage()
  const openClearDialog = useSetAtom(archiveClearDialogAtom)

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed px-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <HardDriveIcon className="size-4 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium">
            {formatBytes(usage.bytes)} on disk
          </span>
          <span className="text-xs text-muted-foreground">
            {usage.archives === 1
              ? "1 saved copy"
              : `${usage.archives} saved copies`}
          </span>
        </div>
      </div>
      <Button
        variant="destructive-outline"
        disabled={usage.archives === 0 && usage.bytes === 0}
        onClick={() => openClearDialog(true)}
      >
        <Trash2Icon />
        Clear
      </Button>
    </div>
  )
}

export const ArchiveSettings = () => {
  const { settings, toggle, backfill, backfilling } = useArchiveSettings()
  const enabled = ARCHIVE_FORMATS.filter((format) => settings[format])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {ARCHIVE_FORMATS.map((format) => {
          const id = `archive-${ARCHIVE_SLUGS[format]}`

          return (
            <div
              key={format}
              className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ArchiveFormatIcon format={format} />
                <div className="flex min-w-0 flex-col">
                  <Label htmlFor={id}>{ARCHIVE_LABELS[format]}</Label>
                  <span className="text-xs text-muted-foreground">
                    {ARCHIVE_DESCRIPTIONS[format]}
                  </span>
                </div>
              </div>
              <Switch
                id={id}
                checked={settings[format]}
                onCheckedChange={(checked) => void toggle(format, checked)}
              />
            </div>
          )
        })}
      </div>
      <Usage />
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          disabled={enabled.length === 0 || backfilling}
          onClick={() => void backfill()}
        >
          {backfilling ? <Loader2Icon className="animate-spin" /> : null}
          {backfilling ? "Queueing…" : "Archive everything missing"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {enabled.length === 0
            ? "Turn a format on to archive new bookmarks."
            : "Queues the formats above for bookmarks that do not have them yet."}
        </span>
      </div>
    </div>
  )
}
