"use client"

import { RotateCcwIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@loomark/ui/components/button"
import { CollectionIcon } from "@loomark/ui/components/collection-icon"
import { Field } from "@loomark/ui/components/field"
import { IconGrid } from "@loomark/ui/components/icon-grid"
import { Input } from "@loomark/ui/components/input"
import { useIconSearch } from "@loomark/ui/hooks/use-icon-search"

export const IconPicker = ({
  value,
  onChange,
}: {
  value: string | null
  onChange: (value: string | null) => void
}) => {
  const { query, onQueryChange, results, gridRef } = useIconSearch(value)

  return (
    <Field
      label="Icon"
      htmlFor="collection-icon"
      hint={
        <span className="text-xs text-muted-foreground tabular-nums">
          {results.length} icons
        </span>
      }
    >
      <div className="flex items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40">
          <CollectionIcon name={value} className="size-4" />
        </span>
        <Input
          id="collection-icon"
          placeholder="Search all Lucide icons"
          value={query}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            onQueryChange(event.target.value)
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
    </Field>
  )
}
