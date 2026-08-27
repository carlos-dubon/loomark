export const VIEW_MODES = ["grid", "list"] as const

export type ViewMode = (typeof VIEW_MODES)[number]

const KNOWN = new Set<string>(VIEW_MODES)

export const toViewMode = (value: string): ViewMode =>
  KNOWN.has(value) ? (value as ViewMode) : "grid"
