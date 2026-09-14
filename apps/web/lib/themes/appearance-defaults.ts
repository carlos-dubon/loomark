import { DEFAULT_GRID_COLUMNS } from "@loomark/core/view-mode"

import type { AppearanceDTO } from "@/lib/themes/appearance"
import { DEFAULT_THEME_ID } from "@/lib/themes/theme"

export const DEFAULT_APPEARANCE: AppearanceDTO = {
  themeId: DEFAULT_THEME_ID,
  viewMode: "grid",
  gridColumns: DEFAULT_GRID_COLUMNS,
  sortOrder: "custom",
}
