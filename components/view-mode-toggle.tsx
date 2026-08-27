"use client"

import { LayoutGridIcon, ListIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useViewMode } from "@/hooks/use-view-mode"

export const ViewModeToggle = () => {
  const { mode, select } = useViewMode()

  return (
    <div className="flex items-center rounded-lg border p-0.5">
      <Button
        variant={mode === "grid" ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label="Grid view"
        aria-pressed={mode === "grid"}
        onClick={() => select("grid")}
      >
        <LayoutGridIcon />
      </Button>
      <Button
        variant={mode === "list" ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label="List view"
        aria-pressed={mode === "list"}
        onClick={() => select("list")}
      >
        <ListIcon />
      </Button>
    </div>
  )
}
