"use client"

import { useAtomValue } from "jotai"
import { useHydrateAtoms } from "jotai/utils"

import type { AppearanceDTO } from "@/lib/themes/appearance"
import {
  appearanceAtom,
  openInNewTabAtom,
  sortOrderAtom,
  themeCssAtom,
  viewModeAtom,
} from "@/store/atoms"

export const AppearanceProvider = ({
  appearance,
  themeCss,
  openInNewTab,
  children,
}: {
  appearance: AppearanceDTO
  themeCss: string
  openInNewTab: boolean
  children: React.ReactNode
}) => {
  useHydrateAtoms([
    [appearanceAtom, appearance],
    [viewModeAtom, appearance.viewMode],
    [sortOrderAtom, appearance.sortOrder],
    [themeCssAtom, themeCss],
    [openInNewTabAtom, openInNewTab],
  ])

  return (
    <>
      <ThemeStyle />
      {children}
    </>
  )
}

const ThemeStyle = () => {
  const css = useAtomValue(themeCssAtom)

  return css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null
}
