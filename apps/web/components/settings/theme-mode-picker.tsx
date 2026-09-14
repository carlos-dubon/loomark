"use client"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@loomark/ui/components/toggle-group"

import { useThemeMode } from "@/hooks/use-theme-mode"
import { THEME_MODE_OPTIONS, toThemeMode } from "@/lib/theme-mode"

export const ThemeModePicker = () => {
  const { mode, select } = useThemeMode()

  return (
    <ToggleGroup
      variant="segmented"
      aria-label="Color mode"
      value={[mode]}
      onValueChange={([next]) => {
        if (next) {
          select(toThemeMode(next))
        }
      }}
    >
      {THEME_MODE_OPTIONS.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="px-2.5"
        >
          <option.icon />
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
