"use client"

import { useHydrateAtoms } from "jotai/utils"
import { useMemo } from "react"

import { useAppearance } from "@/hooks/use-appearance"
import { THEMES } from "@/lib/themes/palettes"
import type { ThemeMode } from "@/lib/theme-mode"
import { findTheme, themeToCss } from "@/lib/themes/theme"
import { openInNewTabAtom, serverThemeModeAtom } from "@/store/atoms"

export const AppearanceProvider = ({
  openInNewTab,
  themeMode,
  children,
}: {
  openInNewTab: boolean
  themeMode: ThemeMode
  children: React.ReactNode
}) => {
  useHydrateAtoms([
    [openInNewTabAtom, openInNewTab],
    [serverThemeModeAtom, themeMode],
  ])

  return (
    <>
      <ThemeStyle />
      {children}
    </>
  )
}

const ThemeStyle = () => {
  const { themeId } = useAppearance()
  const css = useMemo(() => themeToCss(findTheme(THEMES, themeId)), [themeId])

  return css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null
}
