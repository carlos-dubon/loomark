import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

export const THEME_MODES = ["light", "dark", "system"] as const

export type ThemeMode = (typeof THEME_MODES)[number]

export const THEME_MODE_OPTIONS = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] satisfies { value: ThemeMode; label: string; icon: typeof SunIcon }[]

export const THEME_COOKIE_NAME = "loomark_theme"

export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const toThemeMode = (value: string | undefined): ThemeMode =>
  THEME_MODES.find((mode) => mode === value) ?? "system"
