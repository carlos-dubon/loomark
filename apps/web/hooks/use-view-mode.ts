"use client"

import { useAppearanceSetting } from "@/hooks/use-appearance-setting"
import { viewModeAtom } from "@/store/atoms"

export const useViewMode = () => {
  const [mode, select] = useAppearanceSetting(
    viewModeAtom,
    "viewMode",
    "Could not save view"
  )

  return { mode, select }
}
