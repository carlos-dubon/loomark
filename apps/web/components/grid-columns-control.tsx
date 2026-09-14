"use client"

import { Columns3Icon } from "lucide-react"

import {
  DEFAULT_GRID_COLUMNS,
  GRID_COLUMNS,
  type GridColumns,
} from "@loomark/core/view-mode"
import { Button } from "@loomark/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@loomark/ui/components/popover"
import { Slider, SliderLabel, SliderValue } from "@loomark/ui/components/slider"

import { useGridColumns } from "@/hooks/use-grid-columns"

const label = (columns: GridColumns) => (columns === "auto" ? "Auto" : columns)

const toColumns = (value: number | readonly number[]) =>
  GRID_COLUMNS[typeof value === "number" ? value : (value[0] ?? 0)] ??
  DEFAULT_GRID_COLUMNS

export const GridColumnsControl = () => {
  const { columns, select, setPreview } = useGridColumns()

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) {
          setPreview(null)
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label="Grid columns"
            className="max-md:hidden"
          />
        }
      >
        <Columns3Icon />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <Slider
          min={0}
          max={GRID_COLUMNS.length - 1}
          value={GRID_COLUMNS.indexOf(columns)}
          onValueChange={(value) => setPreview(toColumns(value))}
          onValueCommitted={(value) => select(toColumns(value))}
          getAriaValueText={(_formatted, value) => label(toColumns(value))}
        >
          <div className="mb-3 flex items-center justify-between">
            <SliderLabel>Columns</SliderLabel>
            <SliderValue className="text-muted-foreground">
              {(_formatted, values) => label(toColumns(values))}
            </SliderValue>
          </div>
        </Slider>
        <div
          aria-hidden="true"
          className="mt-3 flex w-full items-center justify-between gap-1 px-2.5 text-xs font-medium text-muted-foreground sm:px-2"
        >
          {GRID_COLUMNS.map((tick) => (
            <span
              key={tick}
              className="flex w-0 flex-col items-center justify-center gap-2"
            >
              <span className="h-1 w-px bg-muted-foreground/72" />
              <span>{label(tick)}</span>
            </span>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
