"use client"

import { useAppearanceSetting } from "@/hooks/use-appearance-setting"

export const useViewMode = () => {
  const [mode, select] = useAppearanceSetting("viewMode", "Could not save view")

  return { mode, select }
}
