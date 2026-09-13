"use client"

import { useAppearance, useUpdateAppearance } from "@/hooks/use-appearance"
import type { AppearanceUpdateInput } from "@/lib/schemas"
import type { AppearanceDTO } from "@/lib/themes/appearance"

type Key = keyof AppearanceDTO

export const useAppearanceSetting = <K extends Key>(
  key: K,
  fallback: string
) => {
  const value = useAppearance()[key]
  const { mutate } = useUpdateAppearance(fallback)

  const select = (next: AppearanceDTO[K]) => {
    if (next === value) {
      return
    }

    mutate({ [key]: next } as AppearanceUpdateInput)
  }

  return [value, select] as const
}
