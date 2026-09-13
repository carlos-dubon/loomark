"use client"

import { CheckIcon } from "lucide-react"

import { cn } from "@loomark/core/utils"
import { Spinner } from "@loomark/ui/components/spinner"

import { useAppearance, useUpdateAppearance } from "@/hooks/use-appearance"
import { useIsDark } from "@/hooks/use-is-dark"
import { THEME_OPTIONS } from "@/lib/themes/palettes"
import type { ThemeSwatch } from "@/lib/themes/theme"

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
  const appearance = useAppearance()
  const dark = useIsDark()
  const {
    mutate,
    isPending: saving,
    variables,
  } = useUpdateAppearance("Could not save theme")
  const savingId = saving ? variables.themeId : null

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
            onClick={() => mutate({ themeId: option.id })}
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
            {savingId === option.id ? (
              <Spinner
                aria-hidden="true"
                className="size-4 shrink-0 text-primary"
              />
            ) : active ? (
              <CheckIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-primary"
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
