"use client"

import { useAtom } from "jotai"
import { ArrowUpDownIcon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SORT_LABELS, SORT_ORDERS, type SortOrder } from "@/lib/sort"
import { sortOrderAtom } from "@/store/atoms"

export const SortOrderSelect = () => {
  const [order, setOrder] = useAtom(sortOrderAtom)

  return (
    <Select
      value={order}
      onValueChange={(value) => setOrder(value as SortOrder)}
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
