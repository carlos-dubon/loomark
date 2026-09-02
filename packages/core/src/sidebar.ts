export const SIDEBAR_SIDES = ["left", "right"] as const

export type SidebarSide = (typeof SIDEBAR_SIDES)[number]

export const SIDEBAR_SIDE_LABELS: Record<SidebarSide, string> = {
  left: "Left",
  right: "Right",
}

const KNOWN_SIDES = new Set<string>(SIDEBAR_SIDES)

export const toSidebarSide = (value: string): SidebarSide =>
  KNOWN_SIDES.has(value) ? (value as SidebarSide) : "left"

export const NOISE_LEVELS = ["off", "subtle", "medium", "strong"] as const

export type NoiseLevel = (typeof NOISE_LEVELS)[number]

export const NOISE_LABELS: Record<NoiseLevel, string> = {
  off: "Off",
  subtle: "Subtle",
  medium: "Medium",
  strong: "Strong",
}

export const NOISE_OPACITY: Record<NoiseLevel, number> = {
  off: 0,
  subtle: 0.1,
  medium: 0.18,
  strong: 0.28,
}

const KNOWN_LEVELS = new Set<string>(NOISE_LEVELS)

export const toNoiseLevel = (value: string): NoiseLevel =>
  KNOWN_LEVELS.has(value) ? (value as NoiseLevel) : "off"
