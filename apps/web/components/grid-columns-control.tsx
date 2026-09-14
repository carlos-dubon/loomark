"use client"

import { Columns3Icon } from "lucide-react"

import { MAX_GRID_COLUMNS, MIN_GRID_COLUMNS } from "@loomark/core/view-mode"
import { Button } from "@loomark/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@loomark/ui/components/popover"
import { Slider, SliderLabel, SliderValue } from "@loomark/ui/components/slider"

import { useGridColumns } from "@/hooks/use-grid-columns"

const TICKS = Array.from(
  { length: MAX_GRID_COLUMNS - MIN_GRID_COLUMNS + 1 },
  (_, index) => MIN_GRID_COLUMNS + index
)

const toNumber = (value: number | readonly number[]) =>
  typeof value === "number" ? value : (value[0] ?? MIN_GRID_COLUMNS)

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
          min={MIN_GRID_COLUMNS}
          max={MAX_GRID_COLUMNS}
          value={columns}
          onValueChange={(value) => setPreview(toNumber(value))}
          onValueCommitted={(value) => select(toNumber(value))}
        >
          <div className="mb-3 flex items-center justify-between">
            <SliderLabel>Columns</SliderLabel>
            <SliderValue className="text-muted-foreground" />
          </div>
        </Slider>
        <div
          aria-hidden="true"
          className="mt-3 flex w-full items-center justify-between gap-1 px-2.5 text-xs font-medium text-muted-foreground sm:px-2"
        >
          {TICKS.map((tick) => (
            <span
              key={tick}
              className="flex w-0 flex-col items-center justify-center gap-2"
            >
              <span className="h-1 w-px bg-muted-foreground/72" />
              <span>{tick}</span>
            </span>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
