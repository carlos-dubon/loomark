"use client"

import { useAtom } from "jotai"
import { toast } from "sonner"

import type { NoiseLevel, SidebarSide } from "@loomark/core/sidebar"

import { api } from "@/lib/client-api"
import { sidebarNoiseAtom, sidebarSideAtom } from "@/store/atoms"

export const useSidebarSide = () => {
  const [side, setSide] = useAtom(sidebarSideAtom)

  const select = async (next: SidebarSide) => {
    if (next === side) {
      return
    }

    setSide(next)

    try {
      await api.updateAppearance({ sidebarSide: next })
    } catch (cause) {
      setSide(side)
      toast.error(
        cause instanceof Error ? cause.message : "Could not save sidebar side"
      )
    }
  }

  return { side, select }
}

export const useSidebarNoise = () => {
  const [noise, setNoise] = useAtom(sidebarNoiseAtom)

  const select = async (next: NoiseLevel) => {
    if (next === noise) {
      return
    }

    setNoise(next)

    try {
      await api.updateAppearance({ sidebarNoise: next })
    } catch (cause) {
      setNoise(noise)
      toast.error(
        cause instanceof Error ? cause.message : "Could not save sidebar noise"
      )
    }
  }

  return { noise, select }
}
