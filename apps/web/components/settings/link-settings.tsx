"use client"

import { Label } from "@loomark/ui/components/label"
import { Switch } from "@loomark/ui/components/switch"

import { useOpenInNewTab } from "@/hooks/use-open-in-new-tab"

export const LinkSettings = () => {
  const { newTab, select } = useOpenInNewTab()

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor="open-in-new-tab">Open links in a new tab</Label>
        <span className="text-xs text-muted-foreground">
          Turn it off if this is your new tab page.
        </span>
      </div>
      <Switch id="open-in-new-tab" checked={newTab} onCheckedChange={select} />
    </div>
  )
}
