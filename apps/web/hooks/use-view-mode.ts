"use client"

import { useAtom } from "jotai"
import { toast } from "sonner"

import { api } from "@/lib/client-api"
import type { ViewMode } from "@/lib/view-mode"
import { viewModeAtom } from "@/store/atoms"

export const useViewMode = () => {
  const [mode, setMode] = useAtom(viewModeAtom)

  const select = async (next: ViewMode) => {
    if (next === mode) {
      return
    }

    setMode(next)

    try {
      await api.updateAppearance({ viewMode: next })
    } catch (cause) {
      setMode(mode)
      toast.error(
        cause instanceof Error ? cause.message : "Could not save view"
      )
    }
  }

  return { mode, select }
}
