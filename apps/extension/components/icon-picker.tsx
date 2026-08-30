import Fuse from "fuse.js"
import { RotateCcwIcon } from "lucide-react"
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic"
import { useMemo, useState } from "react"

import { isIconName } from "@/components/collection-icon"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/field"
import { cn } from "@/lib/utils"

const RESULT_LIMIT = 48

const SUGGESTED: IconName[] = [
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

const fuse = new Fuse(
  iconNames.map((name) => ({ name, words: name.split("-") })),
  {
    keys: [
      { name: "name", weight: 2 },
      { name: "words", weight: 1 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 1,
  }
)

export const IconPicker = ({
  value,
  onChange,
}: {
  value: string | null
  onChange: (value: string | null) => void
}) => {
  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    const trimmed = query.trim()

    if (!trimmed) {
      const selected = isIconName(value) && !SUGGESTED.includes(value)
      return selected ? [value, ...SUGGESTED] : SUGGESTED
    }

    return fuse
      .search(trimmed, { limit: RESULT_LIMIT })
      .map((result) => result.item.name)
  }, [query, value])

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="collection-icon">Icon</Label>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="iconSm"
            aria-label="Clear icon"
            onClick={() => onChange(null)}
          >
            <RotateCcwIcon />
          </Button>
        ) : null}
      </div>
      <Input
        id="collection-icon"
        placeholder="Search icons"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="grid max-h-32 grid-cols-8 gap-1 overflow-y-auto rounded-md border p-1.5">
        {results.length === 0 ? (
          <p className="col-span-8 py-3 text-center text-xs text-muted-foreground">
            No icons match “{query.trim()}”
          </p>
        ) : (
          results.map((name) => (
            <button
              key={name}
              type="button"
              aria-label={name}
              aria-pressed={value === name}
              onClick={() => onChange(name)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-sm transition-colors hover:bg-accent",
                value === name &&
                  "bg-primary text-primary-foreground hover:bg-primary"
              )}
            >
              <DynamicIcon
                name={name}
                className="size-4"
                fallback={() => <span className="size-4" />}
              />
            </button>
          ))
        )}
      </div>
    </div>
  )
}
