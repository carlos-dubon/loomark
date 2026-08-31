"use client"

import { RotateCcwIcon } from "lucide-react"
import { type IconName } from "lucide-react/dynamic"
import * as React from "react"
import { useMemo, useRef, useState } from "react"

import { Button } from "@loomark/ui/components/button"
import {
  CollectionIcon,
  isIconName,
} from "@loomark/ui/components/collection-icon"
import { IconGrid, type IconGridHandle } from "@loomark/ui/components/icon-grid"
import { Input } from "@loomark/ui/components/input"
import { Label } from "@loomark/ui/components/label"
import { iconNames, searchIcons, SUGGESTED_ICONS } from "@loomark/ui/lib/icons"

export const IconPicker = ({
  value,
  onChange,
}: {
  value: string | null
  onChange: (value: string | null) => void
}) => {
  const [query, setQuery] = useState("")
  const [initialValue] = useState(() => (isIconName(value) ? value : null))
  const gridRef = useRef<IconGridHandle | null>(null)

  const results = useMemo<IconName[]>(() => {
    if (!query.trim()) {
      const pinned = initialValue
        ? [
            initialValue,
            ...SUGGESTED_ICONS.filter((name) => name !== initialValue),
          ]
        : SUGGESTED_ICONS
      const seen = new Set(pinned)

      return [...pinned, ...iconNames.filter((name) => !seen.has(name))]
    }

    return searchIcons(query)
  }, [query, initialValue])

  const handleQueryChange = (next: string) => {
    setQuery(next)
    gridRef.current?.scrollToTop()
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
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            handleQueryChange(event.target.value)
          }
          onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
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
        <IconGrid
          icons={results}
          value={value}
          onChange={onChange}
          handleRef={gridRef}
          className="h-56 rounded-md border"
          viewportClassName="p-2"
        />
      )}
    </div>
  )
}
