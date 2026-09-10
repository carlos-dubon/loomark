"use client"

import { useAppearanceSetting } from "@/hooks/use-appearance-setting"
import { sortOrderAtom } from "@/store/atoms"

export const useSortOrder = () => {
  const [order, select] = useAppearanceSetting(
    sortOrderAtom,
    "sortOrder",
    "Could not save sort order"
  )

  return { order, select }
}
