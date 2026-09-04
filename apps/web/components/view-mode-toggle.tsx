"use client"

import { LayoutGridIcon, ListIcon } from "lucide-react"

import { VIEW_MODES, type ViewMode } from "@loomark/core/view-mode"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@loomark/ui/components/toggle-group"

import { useViewMode } from "@/hooks/use-view-mode"

const ICONS: Record<ViewMode, typeof LayoutGridIcon> = {
  grid: LayoutGridIcon,
  list: ListIcon,
}

const LABELS: Record<ViewMode, string> = {
  grid: "Grid view",
  list: "List view",
}

export const ViewModeToggle = () => {
  const { mode, select } = useViewMode()

  return (
    <ToggleGroup
      variant="segmented"
      size="sm"
      value={[mode]}
      onValueChange={([next]) => {
        if (next) {
          void select(next as ViewMode)
        }
      }}
    >
      {VIEW_MODES.map((value) => {
        const Icon = ICONS[value]

        return (
          <ToggleGroupItem key={value} value={value} aria-label={LABELS[value]}>
            <Icon />
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
