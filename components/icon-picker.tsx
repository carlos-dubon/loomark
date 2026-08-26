"use client"

import { RotateCcwIcon } from "lucide-react"
import { iconNames } from "lucide-react/dynamic"
import { useMemo, useState } from "react"

import { CollectionIcon } from "@/components/collection-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const RESULT_LIMIT = 64

const SUGGESTED = [
  "folder",
  "folder-open",
  "bookmark",
  "star",
  "heart",
  "book",
  "book-open",
  "library",
  "briefcase",
  "code",
  "terminal",
  "palette",
  "camera",
  "music",
  "film",
  "gamepad-2",
  "graduation-cap",
  "lightbulb",
  "rocket",
  "plane",
  "map-pin",
  "shopping-cart",
  "utensils",
  "dumbbell",
  "leaf",
  "sparkles",
  "flame",
  "zap",
  "globe",
  "newspaper",
  "file-text",
  "pen-tool",
  "image",
  "video",
  "headphones",
  "wallet",
  "chart-line",
  "users",
  "house",
  "calendar",
  "inbox",
  "tag",
  "flask-conical",
  "wrench",
]

export const IconPicker = ({
  value,
  onChange,
}: {
  value: string | null
  onChange: (value: string | null) => void
}) => {
  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase().replace(/\s+/g, "-")

    if (!needle) {
      return SUGGESTED
    }

    return iconNames
      .filter((name) => name.includes(needle))
      .slice(0, RESULT_LIMIT)
  }, [query])

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="collection-icon">Icon</Label>
      <div className="flex items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40">
          <CollectionIcon name={value} className="size-4" />
        </span>
        <Input
          id="collection-icon"
          placeholder="Search all Lucide icons"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
            }
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Use the default folder icon"
          disabled={!value}
          onClick={() => onChange(null)}
        >
          <RotateCcwIcon />
        </Button>
      </div>
      {results.length === 0 ? (
        <p className="rounded-md border px-3 py-6 text-center text-xs text-muted-foreground">
          No icon matches “{query.trim()}”
        </p>
      ) : (
        <div className="no-scrollbar grid max-h-40 scroll-fade-y grid-cols-8 gap-1 overflow-y-auto rounded-md border p-2">
          {results.map((name) => (
            <button
              key={name}
              type="button"
              title={name}
              aria-label={name}
              aria-pressed={value === name}
              onClick={() => onChange(name)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                value === name &&
                  "bg-accent text-accent-foreground ring-1 ring-foreground/20"
              )}
            >
              <CollectionIcon name={name} className="size-4" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
