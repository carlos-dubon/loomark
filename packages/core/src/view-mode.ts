export const VIEW_MODES = ["grid", "list"] as const

export type ViewMode = (typeof VIEW_MODES)[number]

const KNOWN = new Set<string>(VIEW_MODES)

export const toViewMode = (value: string): ViewMode =>
  KNOWN.has(value) ? (value as ViewMode) : "grid"

export const MIN_GRID_COLUMNS = 1

export const MAX_GRID_COLUMNS = 6

export const DEFAULT_GRID_COLUMNS = 4

export const toGridColumns = (value: number) =>
  Number.isInteger(value) &&
  value >= MIN_GRID_COLUMNS &&
  value <= MAX_GRID_COLUMNS
    ? value
    : DEFAULT_GRID_COLUMNS
