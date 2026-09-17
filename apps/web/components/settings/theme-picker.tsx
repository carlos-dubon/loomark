"use client"

import { CheckIcon } from "lucide-react"

import { cn } from "@loomark/core/utils"
import { Spinner } from "@loomark/ui/components/spinner"
import { controlSurface } from "@loomark/ui/lib/control"

import { useAppearance, useUpdateAppearance } from "@/hooks/use-appearance"
import { THEME_OPTIONS } from "@/lib/themes/palettes"
import type { ThemeSwatch } from "@/lib/themes/theme"

const Preview = ({
  swatch,
  className,
}: {
  swatch: ThemeSwatch
  className?: string
}) => (
  <span
    className={cn(
      "flex h-11 w-14 shrink-0 overflow-hidden rounded-[calc(var(--radius-xl)-7px)] border",
      className
    )}
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
        className="h-2.5 w-full rounded-[2px]"
        style={{ backgroundColor: swatch.primary }}
      />
    </span>
  </span>
)

export const ThemePicker = () => {
  const appearance = useAppearance()
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
              controlSurface,
              "relative flex cursor-pointer items-center gap-3 rounded-xl p-1.5 text-left transition-[box-shadow,background-color] disabled:cursor-progress",
              active
                ? "border-ring ring-2 ring-ring/24"
                : "hover:bg-accent/50 dark:hover:bg-input/64"
            )}
          >
            <Preview swatch={option.light} className="dark:hidden" />
            <Preview swatch={option.dark} className="hidden dark:flex" />
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
