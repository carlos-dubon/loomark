"use client"

import { useAtom, type PrimitiveAtom } from "jotai"
import { toast } from "sonner"

import { errorMessage } from "@loomark/core/format"

import { api } from "@/lib/client/api"
import type { AppearanceUpdateInput } from "@/lib/schemas"

type Key = keyof AppearanceUpdateInput

export const useAppearanceSetting = <K extends Key>(
  valueAtom: PrimitiveAtom<NonNullable<AppearanceUpdateInput[K]>>,
  key: K,
  fallback: string
) => {
  const [value, setValue] = useAtom(valueAtom)

  const select = async (next: NonNullable<AppearanceUpdateInput[K]>) => {
    if (next === value) {
      return
    }

    setValue(next)

    try {
      await api.updateAppearance({ [key]: next } as AppearanceUpdateInput)
    } catch (cause) {
      setValue(value)
      toast.error(errorMessage(cause, fallback))
    }
  }

  return [value, select] as const
}
