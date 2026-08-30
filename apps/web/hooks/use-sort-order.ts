"use client"

import { useAtom } from "jotai"
import { toast } from "sonner"

import { api } from "@/lib/client-api"
import type { SortOrder } from "@/lib/sort"
import { sortOrderAtom } from "@/store/atoms"

export const useSortOrder = () => {
  const [order, setOrder] = useAtom(sortOrderAtom)

  const select = async (next: SortOrder) => {
    if (next === order) {
      return
    }

    setOrder(next)

    try {
      await api.updateAppearance({ sortOrder: next })
    } catch (cause) {
      setOrder(order)
      toast.error(
        cause instanceof Error ? cause.message : "Could not save sort order"
      )
    }
  }

  return { order, select }
}
