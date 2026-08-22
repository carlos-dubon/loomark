"use client"

import { useAtom } from "jotai"
import { LayoutGridIcon, ListIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { viewModeAtom } from "@/store/atoms"

export const ViewModeToggle = () => {
  const [mode, setMode] = useAtom(viewModeAtom)

  return (
    <div className="flex items-center rounded-lg border p-0.5">
      <Button
        variant={mode === "grid" ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label="Grid view"
        aria-pressed={mode === "grid"}
        onClick={() => setMode("grid")}
      >
        <LayoutGridIcon />
      </Button>
      <Button
        variant={mode === "list" ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label="List view"
        aria-pressed={mode === "list"}
        onClick={() => setMode("list")}
      >
        <ListIcon />
      </Button>
    </div>
  )
}
