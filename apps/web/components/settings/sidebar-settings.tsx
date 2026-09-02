"use client"

import { PanelLeftIcon, PanelRightIcon } from "lucide-react"

import {
  NOISE_LABELS,
  NOISE_LEVELS,
  NOISE_OPACITY,
  SIDEBAR_SIDES,
  SIDEBAR_SIDE_LABELS,
  type SidebarSide,
} from "@loomark/core/sidebar"
import { cn } from "@loomark/core/utils"
import { Button } from "@loomark/ui/components/button"

import { useSidebarNoise, useSidebarSide } from "@/hooks/use-sidebar-appearance"

const SIDE_ICONS: Record<SidebarSide, typeof PanelLeftIcon> = {
  left: PanelLeftIcon,
  right: PanelRightIcon,
}

const SidePicker = () => {
  const { side, select } = useSidebarSide()

  return (
    <div className="flex items-center gap-2">
      {SIDEBAR_SIDES.map((value) => {
        const Icon = SIDE_ICONS[value]

        return (
          <Button
            key={value}
            variant={side === value ? "secondary" : "outline"}
            aria-pressed={side === value}
            onClick={() => void select(value)}
          >
            <Icon className="text-muted-foreground" />
            {SIDEBAR_SIDE_LABELS[value]}
          </Button>
        )
      })}
    </div>
  )
}

const NoisePicker = () => {
  const { noise, select } = useSidebarNoise()

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {NOISE_LEVELS.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={noise === value}
          onClick={() => void select(value)}
          className={cn(
            "flex cursor-pointer flex-col gap-2 rounded-lg border p-2 transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            noise === value && "border-primary bg-accent/50 ring-1 ring-primary"
          )}
        >
          <span className="relative isolate block h-10 w-full overflow-hidden rounded-md border bg-sidebar">
            <span
              className="sidebar-noise"
              style={
                {
                  "--sidebar-noise-opacity": NOISE_OPACITY[value],
                } as React.CSSProperties
              }
            />
          </span>
          <span className="text-xs font-medium">{NOISE_LABELS[value]}</span>
        </button>
      ))}
    </div>
  )
}

export const SidebarSettings = () => (
  <div className="flex flex-col gap-6">
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Position</p>
      <SidePicker />
    </div>
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Noise</p>
      <NoisePicker />
    </div>
  </div>
)
