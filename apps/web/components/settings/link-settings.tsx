"use client"

import { Label } from "@loomark/ui/components/label"
import { Switch } from "@loomark/ui/components/switch"

import { useOpenInNewTab } from "@/hooks/use-open-in-new-tab"

export const LinkSettings = () => {
  const { newTab, select } = useOpenInNewTab()

  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div className="flex flex-col">
        <Label htmlFor="open-in-new-tab">Open links in a new tab</Label>
        <span className="text-xs text-muted-foreground">
          Turn it off to open them in the current tab.
        </span>
      </div>
      <Switch id="open-in-new-tab" checked={newTab} onCheckedChange={select} />
    </div>
  )
}
