"use client"

import { useAppearanceSetting } from "@/hooks/use-appearance-setting"

export const useSortOrder = () => {
  const [order, select] = useAppearanceSetting(
    "sortOrder",
    "Could not save sort order"
  )

  return { order, select }
}
