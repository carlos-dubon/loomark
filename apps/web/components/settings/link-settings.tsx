"use client"

import { SwitchField } from "@loomark/ui/components/field"

import { useOpenInNewTab } from "@/hooks/use-open-in-new-tab"

export const LinkSettings = () => {
  const { newTab, select } = useOpenInNewTab()

  return (
    <SwitchField
      id="open-in-new-tab"
      label="Open links in a new tab"
      description="Turn it off if this is your new tab page."
      checked={newTab}
      onCheckedChange={select}
    />
  )
}
