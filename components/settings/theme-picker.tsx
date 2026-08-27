"use client"

import { useAtom, useSetAtom } from "jotai"
import { CheckIcon, SearchIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useIsDark } from "@/hooks/use-is-dark"
import { api } from "@/lib/client-api"
import { THEME_PRESETS } from "@/lib/themes/presets"
import {
  DEFAULT_THEME_PRESET,
  findPreset,
  fontLabel,
  fontStylesheetFor,
  presetToCss,
  type ThemePreset,
} from "@/lib/themes/theme"
import { cn } from "@/lib/utils"
import { appearanceAtom, fontHrefAtom, themeCssAtom } from "@/store/atoms"

const SWATCHES = ["primary", "secondary", "accent", "muted"] as const

const Swatches = ({ preset, dark }: { preset: ThemePreset; dark: boolean }) => {
  const vars = dark ? preset.dark : preset.light

  return (
    <span
      className="flex size-9 shrink-0 flex-wrap overflow-hidden rounded-md border"
      style={{ borderColor: vars.border, backgroundColor: vars.background }}
    >
      {SWATCHES.map((key) => (
        <span
          key={key}
          className="size-1/2"
          style={{ backgroundColor: vars[key] }}
        />
      ))}
    </span>
  )
}

export const ThemePicker = () => {
  const [appearance, setAppearance] = useAtom(appearanceAtom)
  const setThemeCss = useSetAtom(themeCssAtom)
  const setFontHref = useSetAtom(fontHrefAtom)
  const dark = useIsDark()

  const [query, setQuery] = useState("")
  const [saving, setSaving] = useState<string | null>(null)

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()

    if (!needle) {
      return THEME_PRESETS
    }

    return THEME_PRESETS.filter(
      (preset) =>
        preset.label.toLowerCase().includes(needle) ||
        preset.id.includes(needle.replace(/\s+/g, "-"))
    )
  }, [query])

  const apply = async (preset: ThemePreset) => {
    const previous = appearance

    setThemeCss(presetToCss(preset))
    setFontHref(fontStylesheetFor(preset))
    setAppearance({ ...appearance, themePreset: preset.id })
    setSaving(preset.id)

    try {
      setAppearance(await api.updateAppearance({ themePreset: preset.id }))
    } catch (cause) {
      const restored = findPreset(THEME_PRESETS, previous.themePreset)

      setThemeCss(presetToCss(restored))
      setFontHref(fontStylesheetFor(restored))
      setAppearance(previous)
      toast.error(
        cause instanceof Error ? cause.message : "Could not save theme"
      )
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${THEME_PRESETS.length} themes`}
            aria-label="Search themes"
            className="pl-8"
          />
        </div>
        {appearance.themePreset === DEFAULT_THEME_PRESET ? null : (
          <Button
            variant="outline"
            onClick={() =>
              apply(findPreset(THEME_PRESETS, DEFAULT_THEME_PRESET))
            }
          >
            Reset
          </Button>
        )}
      </div>
      {results.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
          No theme matches “{query.trim()}”
        </p>
      ) : (
        <div className="no-scrollbar grid max-h-[55vh] scroll-fade-y grid-cols-1 gap-2 overflow-y-auto rounded-lg border p-2 sm:max-h-96 sm:grid-cols-2">
          {results.map((preset) => {
            const active = appearance.themePreset === preset.id

            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={active}
                disabled={saving !== null}
                onClick={() => apply(preset)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-progress disabled:opacity-60",
                  active && "border-primary bg-accent/50 ring-1 ring-primary"
                )}
              >
                <Swatches preset={preset} dark={dark} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {preset.label}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {fontLabel(preset)}
                  </span>
                </span>
                {active ? (
                  <CheckIcon className="size-4 shrink-0 text-primary" />
                ) : null}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
