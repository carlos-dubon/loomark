"use client"

import { RotateCcwIcon } from "lucide-react"

import { useIconSearch } from "../hooks/use-icon-search"
import { Button } from "./button"
import { CollectionIcon } from "./collection-icon"
import { Field, type FieldSize } from "./field"
import { IconGrid } from "./icon-grid"
import { Input } from "./input"

export const IconPicker = ({
  value,
  onChange,
  size = "default",
}: {
  value: string | null
  onChange: (value: string | null) => void
  size?: FieldSize
}) => {
  const { query, onQueryChange, results, gridRef } = useIconSearch(value)
  const small = size === "sm"

  return (
    <Field
      size={size}
      label="Icon"
      htmlFor="collection-icon"
      hint={
        <span className="text-xs text-muted-foreground tabular-nums">
          {results.length} icons
        </span>
      }
    >
      <div
        className={
          small ? "flex items-center gap-1.5" : "flex items-center gap-2"
        }
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40">
          <CollectionIcon name={value} className="size-4" />
        </span>
        <Input
          id="collection-icon"
          size={size}
          placeholder="Search all Lucide icons"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
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
      ) : small ? (
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
    </Field>
  )
}
