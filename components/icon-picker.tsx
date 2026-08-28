"use client"

import Fuse from "fuse.js"
import { RotateCcwIcon } from "lucide-react"
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic"
import { useCallback, useMemo, useRef, useState } from "react"

import { CollectionIcon, isIconName } from "@/components/collection-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const MIN_CELL = 36
const GAP = 4
const OVERSCAN = 4

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

const searchIndex = iconNames.map((name) => ({
  name,
  words: name.split("-"),
}))

const fuse = new Fuse(searchIndex, {
  keys: [
    { name: "name", weight: 2 },
    { name: "words", weight: 1 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 1,
})

const useElementSize = () => {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const observerRef = useRef<ResizeObserver | null>(null)

  const ref = useCallback((element: HTMLElement | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null

    if (!element) {
      return
    }

    const measure = () => {
      setSize((current) =>
        current.width === element.clientWidth &&
        current.height === element.clientHeight
          ? current
          : { width: element.clientWidth, height: element.clientHeight }
      )
    }

    measure()

    const observer = new ResizeObserver(measure)

    observer.observe(element)
    observerRef.current = observer
  }, [])

  return [ref, size] as const
}

const IconPlaceholder = () => (
  <span className="size-4 rounded-sm bg-muted-foreground/15" />
)

export const IconPicker = ({
  value,
  onChange,
}: {
  value: string | null
  onChange: (value: string | null) => void
}) => {
  const [query, setQuery] = useState("")
  const [initialValue] = useState(() => (isIconName(value) ? value : null))
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportRef, viewport] = useElementSize()
  const [sizerRef, sizer] = useElementSize()
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const frameRef = useRef<number | null>(null)

  const attachScroller = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element && frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }

      scrollRef.current = element
      viewportRef(element)
    },
    [viewportRef]
  )

  const handleScroll = () => {
    if (frameRef.current !== null) {
      return
    }

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      setScrollTop(scrollRef.current?.scrollTop ?? 0)
    })
  }

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase().replace(/\s+/g, "-")

    if (!needle) {
      const pinned = initialValue
        ? [initialValue, ...SUGGESTED.filter((name) => name !== initialValue)]
        : SUGGESTED
      const seen = new Set(pinned)

      return [...pinned, ...iconNames.filter((name) => !seen.has(name))]
    }

    return fuse.search(needle).map((result) => result.item.name)
  }, [query, initialValue])

  const handleQueryChange = (next: string) => {
    setQuery(next)
    setScrollTop(0)
    scrollRef.current?.scrollTo({ top: 0 })
  }

  const columns = Math.max(
    1,
    Math.floor((sizer.width + GAP) / (MIN_CELL + GAP))
  )
  const cell = sizer.width
    ? (sizer.width - GAP * (columns - 1)) / columns
    : MIN_CELL
  const rowHeight = cell + GAP
  const rowCount = Math.ceil(results.length / columns)
  const firstRow = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN)
  const lastRow = Math.min(
    rowCount - 1,
    Math.ceil((scrollTop + viewport.height) / rowHeight) + OVERSCAN
  )

  const rows = []
  for (let row = firstRow; row <= lastRow; row++) {
    rows.push(row)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor="collection-icon">Icon</Label>
        <span className="text-xs text-muted-foreground tabular-nums">
          {results.length} icons
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40">
          <CollectionIcon name={value} className="size-4" />
        </span>
        <Input
          id="collection-icon"
          placeholder="Search all Lucide icons"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
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
        <div
          ref={attachScroller}
          onScroll={handleScroll}
          style={{ overflowAnchor: "none" }}
          className="no-scrollbar h-56 scroll-fade-y overflow-y-auto rounded-md border p-2"
        >
          <div
            ref={sizerRef}
            className="relative w-full"
            style={{ height: Math.max(0, rowCount * rowHeight - GAP) }}
          >
            {rows.map((row) => (
              <div
                key={row}
                className="absolute inset-x-0 grid"
                style={{
                  top: row * rowHeight,
                  height: cell,
                  gap: GAP,
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                {results
                  .slice(row * columns, row * columns + columns)
                  .map((name) => (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      aria-label={name}
                      aria-pressed={value === name}
                      onClick={() => onChange(name)}
                      className={cn(
                        "flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                        value === name &&
                          "bg-accent text-accent-foreground ring-1 ring-foreground/20"
                      )}
                    >
                      <DynamicIcon
                        name={name}
                        className="size-4"
                        fallback={IconPlaceholder}
                      />
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
