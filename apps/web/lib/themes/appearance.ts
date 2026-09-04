import type { SortOrder } from "@loomark/core/sort"
import type { ViewMode } from "@loomark/core/view-mode"

export type AppearanceDTO = {
  themeId: string
  viewMode: ViewMode
  sortOrder: SortOrder
}
