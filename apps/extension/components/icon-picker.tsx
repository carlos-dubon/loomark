import { RotateCcwIcon } from "lucide-react"
import { DynamicIcon } from "lucide-react/dynamic"
import { useMemo, useState } from "react"

import { cn } from "@loomark/core/utils"
import { Button } from "@loomark/ui/components/button"
import { isIconName } from "@loomark/ui/components/collection-icon"
import { FieldInput, FieldLabel } from "@loomark/ui/components/field"
import { searchIcons, SUGGESTED_ICONS } from "@loomark/ui/lib/icons"

const RESULT_LIMIT = 48

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
      const selected = isIconName(value) && !SUGGESTED_ICONS.includes(value)
      return selected ? [value, ...SUGGESTED_ICONS] : SUGGESTED_ICONS
    }

    return searchIcons(trimmed, RESULT_LIMIT)
  }, [query, value])

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <FieldLabel htmlFor="collection-icon">Icon</FieldLabel>
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
      <FieldInput
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
