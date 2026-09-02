import type { NoiseLevel, SidebarSide } from "@loomark/core/sidebar"
import type { SortOrder } from "@loomark/core/sort"
import type { ViewMode } from "@loomark/core/view-mode"

export type AppearanceDTO = {
  themePreset: string
  viewMode: ViewMode
  sortOrder: SortOrder
  sidebarSide: SidebarSide
  sidebarNoise: NoiseLevel
}
