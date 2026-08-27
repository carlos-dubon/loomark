export type ThemeVars = Record<string, string>

export type ThemePreset = {
  id: string
  label: string
  theme: ThemeVars
  light: ThemeVars
  dark: ThemeVars
}

export const DEFAULT_THEME_PRESET = "default"

const WEB_FONTS = new Set([
  "Antic",
  "Architects Daughter",
  "DM Sans",
  "Fira Code",
  "Geist",
  "Geist Mono",
  "IBM Plex Mono",
  "Inter",
  "JetBrains Mono",
  "Libre Baskerville",
  "Lora",
  "Merriweather",
  "Montserrat",
  "Open Sans",
  "Outfit",
  "Oxanium",
  "Playfair Display",
  "Plus Jakarta Sans",
  "Poppins",
  "Quicksand",
  "Roboto",
  "Roboto Mono",
  "Source Code Pro",
  "Source Serif 4",
  "Space Mono",
  "Ubuntu Mono",
])

const FONT_KEYS = ["font-sans", "font-serif", "font-mono"] as const

const firstFamily = (stack: string) =>
  stack
    .split(",")[0]
    ?.trim()
    .replace(/^["']|["']$/g, "") ?? ""

export const fontLabel = (preset: ThemePreset) => {
  const stack = preset.theme["font-sans"] ?? preset.light["font-sans"] ?? ""
  const family = firstFamily(stack)
  const variable = family.match(
    /^var\(--font-([a-z-]+?)-(?:sans|mono|serif)\)$/
  )

  if (variable) {
    return variable[1].replace(
      /(^|-)([a-z])/g,
      (_, gap, letter: string) => `${gap ? " " : ""}${letter.toUpperCase()}`
    )
  }

  return family || "System"
}

export const fontStylesheetFor = (preset: ThemePreset) => {
  const families = new Set<string>()

  for (const key of FONT_KEYS) {
    const stack = preset.theme[key] ?? preset.light[key]

    if (!stack) {
      continue
    }

    const family = firstFamily(stack)

    if (WEB_FONTS.has(family)) {
      families.add(family)
    }
  }

  if (families.size === 0) {
    return null
  }

  const query = [...families]
    .sort()
    .map(
      (family) =>
        `family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@400;500;600;700`
    )
    .join("&")

  return `https://fonts.googleapis.com/css2?${query}&display=swap`
}

const SAFE_NAME = /^[a-z0-9-]+$/
const UNSAFE_VALUE = /[;{}<>]/

const declarations = (vars: ThemeVars) =>
  Object.entries(vars)
    .filter(
      ([name, value]) => SAFE_NAME.test(name) && !UNSAFE_VALUE.test(value)
    )
    .map(([name, value]) => `--${name}:${value}`)
    .join(";")

export const presetToCss = (preset: ThemePreset) => {
  const base = declarations({ ...preset.theme, ...preset.light })
  const dark = declarations(preset.dark)

  return `:root:root{${base}}:root:root.dark{${dark}}`
}

export const findPreset = (
  presets: ThemePreset[],
  id: string | null | undefined
) =>
  presets.find((preset) => preset.id === id) ??
  presets.find((preset) => preset.id === DEFAULT_THEME_PRESET) ??
  presets[0]
