import { toSortOrder } from "@loomark/core/sort"
import { toViewMode } from "@loomark/core/view-mode"

import { prisma } from "@/lib/prisma"
import type { AppearanceDTO } from "@/lib/themes/appearance"
import { DEFAULT_APPEARANCE } from "@/lib/themes/appearance-defaults"

export const getAppearance = async (userId: string): Promise<AppearanceDTO> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { themePreset: true, viewMode: true, sortOrder: true },
  })

  if (!user) {
    return DEFAULT_APPEARANCE
  }

  return {
    themePreset: user.themePreset,
    viewMode: toViewMode(user.viewMode),
    sortOrder: toSortOrder(user.sortOrder),
  }
}
