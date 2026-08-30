import type { SortOrder } from "@/lib/sort"
import type { ViewMode } from "@/lib/view-mode"

export type AppearanceDTO = {
  themePreset: string
  viewMode: ViewMode
  sortOrder: SortOrder
}
