"use client"

import { useAtomValue } from "jotai"
import { useHydrateAtoms } from "jotai/utils"

import type { AppearanceDTO } from "@/lib/themes/appearance"
import {
  appearanceAtom,
  fontHrefAtom,
  openInNewTabAtom,
  sortOrderAtom,
  themeCssAtom,
  viewModeAtom,
} from "@/store/atoms"

export const AppearanceProvider = ({
  appearance,
  themeCss,
  fontHref,
  openInNewTab,
  children,
}: {
  appearance: AppearanceDTO
  themeCss: string
  fontHref: string | null
  openInNewTab: boolean
  children: React.ReactNode
}) => {
  useHydrateAtoms([
    [appearanceAtom, appearance],
    [viewModeAtom, appearance.viewMode],
    [sortOrderAtom, appearance.sortOrder],
    [themeCssAtom, themeCss],
    [fontHrefAtom, fontHref],
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
  const href = useAtomValue(fontHrefAtom)

  return (
    <>
      {href ? (
        <link rel="stylesheet" href={href} precedence="loomark-theme-font" />
      ) : null}
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  )
}
