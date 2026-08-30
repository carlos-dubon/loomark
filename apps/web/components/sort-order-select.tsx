"use client"

import { ArrowUpDownIcon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSortOrder } from "@/hooks/use-sort-order"
import { SORT_LABELS, SORT_ORDERS, type SortOrder } from "@/lib/sort"

export const SortOrderSelect = () => {
  const { order, select } = useSortOrder()

  return (
    <Select
      value={order}
      onValueChange={(value) => void select(value as SortOrder)}
    >
      <SelectTrigger
        aria-label="Sort bookmarks"
        className="max-sm:w-8 max-sm:justify-center max-sm:gap-0 max-sm:px-0 max-sm:[&_[data-slot=select-icon]]:hidden max-sm:[&_[data-slot=select-value]]:flex-none"
      >
        <ArrowUpDownIcon className="text-muted-foreground" />
        <SelectValue>
          {(value) => (
            <span className="max-sm:hidden">
              {SORT_LABELS[value as SortOrder] ?? SORT_LABELS.newest}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" alignItemWithTrigger={false}>
        {SORT_ORDERS.map((value) => (
          <SelectItem key={value} value={value}>
            {SORT_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
