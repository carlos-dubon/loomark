export const VIEW_MODES = ["grid", "list"] as const

export type ViewMode = (typeof VIEW_MODES)[number]

const KNOWN = new Set<string>(VIEW_MODES)

export const toViewMode = (value: string): ViewMode =>
  KNOWN.has(value) ? (value as ViewMode) : "grid"

export const GRID_COLUMNS = ["auto", "2", "3", "4", "5", "6"] as const

export type GridColumns = (typeof GRID_COLUMNS)[number]

export const DEFAULT_GRID_COLUMNS: GridColumns = "auto"

const KNOWN_GRID_COLUMNS = new Set<string>(GRID_COLUMNS)

export const toGridColumns = (value: string): GridColumns =>
  KNOWN_GRID_COLUMNS.has(value) ? (value as GridColumns) : DEFAULT_GRID_COLUMNS
