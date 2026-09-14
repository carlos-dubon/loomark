"use client"

import { useAtomValue } from "jotai"
import { useTheme } from "next-themes"

import { useMounted } from "@/hooks/use-demo-state"
import { toThemeMode, type ThemeMode } from "@/lib/theme-mode"
import { serverThemeModeAtom } from "@/store/atoms"

export const useThemeMode = () => {
  const { theme, setTheme } = useTheme()
  const serverMode = useAtomValue(serverThemeModeAtom)
  const mounted = useMounted()

  return {
    mode: mounted ? toThemeMode(theme) : serverMode,
    select: (next: ThemeMode) => setTheme(next),
  }
}
