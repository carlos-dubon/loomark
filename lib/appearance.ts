import { prisma } from "@/lib/prisma"
import { toSortOrder } from "@/lib/sort"
import type { AppearanceDTO } from "@/lib/themes/appearance"
import { DEFAULT_APPEARANCE } from "@/lib/themes/appearance-defaults"
import { toViewMode } from "@/lib/view-mode"

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
