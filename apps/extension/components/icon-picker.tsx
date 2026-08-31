import { RotateCcwIcon } from "lucide-react"
import { type IconName } from "lucide-react/dynamic"
import { useMemo, useRef, useState } from "react"

import { Button } from "@loomark/ui/components/button"
import {
  CollectionIcon,
  isIconName,
} from "@loomark/ui/components/collection-icon"
import { FieldInput, FieldLabel } from "@loomark/ui/components/field"
import { IconGrid, type IconGridHandle } from "@loomark/ui/components/icon-grid"
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
    const trimmed = query.trim()

    if (trimmed) {
      return searchIcons(trimmed)
    }

    const pinned = initialValue
      ? [
          initialValue,
          ...SUGGESTED_ICONS.filter((name) => name !== initialValue),
        ]
      : SUGGESTED_ICONS
    const seen = new Set(pinned)

    return [...pinned, ...iconNames.filter((name) => !seen.has(name))]
  }, [query, initialValue])

  const handleQueryChange = (next: string) => {
    setQuery(next)
    gridRef.current?.scrollToTop()
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel htmlFor="collection-icon">Icon</FieldLabel>
        <span className="text-xs text-muted-foreground tabular-nums">
          {results.length} icons
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40">
          <CollectionIcon name={value} className="size-4" />
        </span>
        <FieldInput
          id="collection-icon"
          placeholder="Search all Lucide icons"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
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
          No icons match “{query.trim()}”
        </p>
      ) : (
        <IconGrid
          icons={results}
          value={value}
          onChange={onChange}
          handleRef={gridRef}
          minCell={28}
          className="h-32 rounded-md border"
          viewportClassName="p-1.5"
          buttonClassName="rounded-sm"
          selectedClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
        />
      )}
    </div>
  )
}
