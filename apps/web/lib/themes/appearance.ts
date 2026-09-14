import type { SortOrder } from "@loomark/core/sort"
import type { GridColumns, ViewMode } from "@loomark/core/view-mode"

export type AppearanceDTO = {
  themeId: string
  viewMode: ViewMode
  gridColumns: GridColumns
  sortOrder: SortOrder
}
