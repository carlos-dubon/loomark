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
      <SelectTrigger aria-label="Sort bookmarks">
        <ArrowUpDownIcon className="text-muted-foreground" />
        <SelectValue>
          {(value) => SORT_LABELS[value as SortOrder] ?? SORT_LABELS.newest}
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
