"use client"

import { useAtom, useSetAtom } from "jotai"
import { CheckIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { cn } from "@loomark/core/utils"

import { useIsDark } from "@/hooks/use-is-dark"
import { api } from "@/lib/client-api"
import { THEMES, THEME_OPTIONS } from "@/lib/themes/palettes"
import {
  findTheme,
  themeToCss,
  type ThemeOption,
  type ThemeSwatch,
} from "@/lib/themes/theme"
import { appearanceAtom, themeCssAtom } from "@/store/atoms"

const Preview = ({ swatch }: { swatch: ThemeSwatch }) => (
  <span
    className="flex h-11 w-14 shrink-0 overflow-hidden rounded-md border"
    style={{ backgroundColor: swatch.canvas, borderColor: swatch.accent }}
  >
    <span
      className="flex w-1/3 flex-col justify-end gap-1 p-1"
      style={{ backgroundColor: swatch.sidebar }}
    >
      <span
        className="h-1 rounded-full"
        style={{ backgroundColor: swatch.accent }}
      />
      <span
        className="h-1 w-2/3 rounded-full"
        style={{ backgroundColor: swatch.accent }}
      />
    </span>
    <span className="flex flex-1 items-end p-1">
      <span
        className="h-2.5 w-full rounded-sm"
        style={{ backgroundColor: swatch.primary }}
      />
    </span>
  </span>
)

export const ThemePicker = () => {
  const [appearance, setAppearance] = useAtom(appearanceAtom)
  const setThemeCss = useSetAtom(themeCssAtom)
  const dark = useIsDark()
  const [saving, setSaving] = useState(false)

  const apply = async (option: ThemeOption) => {
    const previous = appearance

    setThemeCss(themeToCss(findTheme(THEMES, option.id)))
    setAppearance({ ...appearance, themeId: option.id })
    setSaving(true)

    try {
      setAppearance(await api.updateAppearance({ themeId: option.id }))
    } catch (cause) {
      setThemeCss(themeToCss(findTheme(THEMES, previous.themeId)))
      setAppearance(previous)
      toast.error(
        cause instanceof Error ? cause.message : "Could not save theme"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {THEME_OPTIONS.map((option) => {
        const active = appearance.themeId === option.id

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            disabled={saving}
            onClick={() => apply(option)}
            className={cn(
              "relative flex cursor-pointer items-center gap-3 rounded-lg border border-input bg-background p-2 text-left shadow-xs/5 transition-[box-shadow,background-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/24 disabled:cursor-progress disabled:opacity-64 dark:bg-input/32",
              active
                ? "border-ring ring-2 ring-ring/24"
                : "hover:bg-accent/50 dark:hover:bg-input/64"
            )}
          >
            <Preview swatch={dark ? option.dark : option.light} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {option.label}
            </span>
            {active ? (
              <CheckIcon className="size-4 shrink-0 text-primary" />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
