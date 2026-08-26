"use client"

import { useTheme } from "next-themes"
import { useCallback } from "react"

import { playSound } from "@/lib/sound"

const THEME_SOUND_SRC = "/sounds/theme-toggle.mp3"
const THEME_SOUND_VOLUME = 0.3

export const useThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme()

  return useCallback(() => {
    void playSound(THEME_SOUND_SRC, THEME_SOUND_VOLUME)
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }, [resolvedTheme, setTheme])
}
