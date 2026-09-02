"use client"

import { CameraIcon, FileTextIcon, GlobeIcon, Loader2Icon } from "lucide-react"

import {
  ARCHIVE_DESCRIPTIONS,
  ARCHIVE_FORMATS,
  ARCHIVE_LABELS,
  ARCHIVE_SLUGS,
  type ArchiveFormat,
} from "@loomark/core/archive"
import { Button } from "@loomark/ui/components/button"
import { Label } from "@loomark/ui/components/label"
import { Switch } from "@loomark/ui/components/switch"

import { useArchiveSettings } from "@/hooks/use-archive-settings"

const ICONS: Record<ArchiveFormat, typeof CameraIcon> = {
  SCREENSHOT: CameraIcon,
  WEBPAGE: GlobeIcon,
  PDF: FileTextIcon,
  MARKDOWN: FileTextIcon,
}

export const ArchiveSettings = () => {
  const { settings, toggle, backfill, backfilling } = useArchiveSettings()
  const enabled = ARCHIVE_FORMATS.filter((format) => settings[format])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {ARCHIVE_FORMATS.map((format) => {
          const Icon = ICONS[format]
          const id = `archive-${ARCHIVE_SLUGS[format]}`

          return (
            <div
              key={format}
              className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Icon className="size-4 shrink-0 text-muted-foreground" />
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
