export type ThemeRole =
  | "canvas"
  | "surface"
  | "surfaceRaised"
  | "surfaceOverlay"
  | "text"
  | "border"
  | "input"
  | "focus"
  | "primary"
  | "primaryForeground"
  | "secondary"
  | "secondaryForeground"
  | "accent"
  | "accentForeground"
  | "muted"
  | "mutedForeground"
  | "placeholder"
  | "secondaryLabel"
  | "iconMuted"
  | "error"
  | "errorForeground"
  | "errorSurface"
  | "warning"
  | "warningForeground"
  | "warningSurface"
  | "sidebar"
  | "sidebarForeground"
  | "sidebarMutedForeground"
  | "sidebarControlSurface"
  | "sidebarRowHover"
  | "sidebarRowActive"
  | "sidebarRowSelected"
  | "sidebarBorder"

export type ThemeColors = Record<ThemeRole, string>

export type Theme = {
  id: string
  label: string
  light: ThemeColors
  dark: ThemeColors
}

export const DEFAULT_THEME_ID = "default"

export type ThemeSwatch = {
  canvas: string
  sidebar: string
  primary: string
  accent: string
}

export type ThemeOption = {
  id: string
  label: string
  light: ThemeSwatch
  dark: ThemeSwatch
}

const ROLE_VARS: Record<ThemeRole, string[]> = {
  canvas: ["background"],
  surface: ["card"],
  surfaceRaised: ["surface-raised"],
  surfaceOverlay: ["popover"],
  text: ["foreground", "card-foreground", "popover-foreground"],
  border: ["border"],
  input: ["input"],
  focus: ["ring"],
  primary: ["primary"],
  primaryForeground: ["primary-foreground"],
  secondary: ["secondary"],
  secondaryForeground: ["secondary-foreground"],
  accent: ["accent"],
  accentForeground: ["accent-foreground"],
  muted: ["muted"],
  mutedForeground: ["muted-foreground"],
  placeholder: ["placeholder"],
  secondaryLabel: ["secondary-label"],
  iconMuted: ["icon-muted"],
  error: ["error", "destructive"],
  errorForeground: ["error-foreground", "destructive-foreground"],
  errorSurface: ["error-surface"],
  warning: ["warning"],
  warningForeground: ["warning-foreground"],
  warningSurface: ["warning-surface"],
  sidebar: ["sidebar", "sidebar-stage-fade"],
  sidebarForeground: ["sidebar-foreground"],
  sidebarMutedForeground: ["sidebar-muted-foreground"],
  sidebarControlSurface: ["sidebar-control-surface"],
  sidebarRowHover: ["sidebar-row-hover"],
  sidebarRowActive: ["sidebar-row-active"],
  sidebarRowSelected: ["sidebar-row-selected"],
  sidebarBorder: ["sidebar-border"],
}

const ROLES = Object.keys(ROLE_VARS) as ThemeRole[]

const COLOR = /^oklch\([\d. ]+\)$/

const declarations = (colors: ThemeColors) =>
  ROLES.flatMap((role) => {
    const value = colors[role]

    return COLOR.test(value)
      ? ROLE_VARS[role].map((name) => `--${name}:${value}`)
      : []
  }).join(";")

export const themeToCss = (theme: Theme | undefined) => {
  if (!theme || theme.id === DEFAULT_THEME_ID) {
    return ""
  }

  return [
    `:root:root{color-scheme:light;${declarations(theme.light)}}`,
    `:root:root.dark{color-scheme:dark;${declarations(theme.dark)}}`,
  ].join("")
}

export const findTheme = (themes: Theme[], id: string | null | undefined) =>
  themes.find((theme) => theme.id === id)

const swatch = (colors: ThemeColors): ThemeSwatch => ({
  canvas: colors.canvas,
  sidebar: colors.sidebar,
  primary: colors.primary,
  accent: colors.accent,
})

export const toThemeOption = (theme: Theme): ThemeOption => ({
  id: theme.id,
  label: theme.label,
  light: swatch(theme.light),
  dark: swatch(theme.dark),
})
