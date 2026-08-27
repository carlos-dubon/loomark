"use client"

import { useAtomValue } from "jotai"
import { useHydrateAtoms } from "jotai/utils"

import type { AppearanceDTO } from "@/lib/themes/appearance"
import {
  appearanceAtom,
  fontHrefAtom,
  sortOrderAtom,
  themeCssAtom,
  viewModeAtom,
} from "@/store/atoms"

export const AppearanceProvider = ({
  appearance,
  themeCss,
  fontHref,
  children,
}: {
  appearance: AppearanceDTO
  themeCss: string
  fontHref: string | null
  children: React.ReactNode
}) => {
  useHydrateAtoms([
    [appearanceAtom, appearance],
    [viewModeAtom, appearance.viewMode],
    [sortOrderAtom, appearance.sortOrder],
    [themeCssAtom, themeCss],
    [fontHrefAtom, fontHref],
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
        <link rel="stylesheet" href={href} precedence="tana-theme-font" />
      ) : null}
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  )
}
