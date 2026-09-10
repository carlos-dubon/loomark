import { RotateCcwIcon } from "lucide-react"

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
      size="sm"
      label="Icon"
      htmlFor="collection-icon"
      hint={
        <span className="text-xs text-muted-foreground tabular-nums">
          {results.length} icons
        </span>
      }
    >
      <div className="flex items-center gap-1.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40">
          <CollectionIcon name={value} className="size-4" />
        </span>
        <Input
          id="collection-icon"
          size="sm"
          placeholder="Search all Lucide icons"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
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
          minCell={28}
          className="h-32 rounded-md border"
          viewportClassName="p-1.5"
          buttonClassName="rounded-sm"
          selectedClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
        />
      )}
    </Field>
  )
}
