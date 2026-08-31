import { browser } from "wxt/browser"

import type { ActiveTab } from "@loomark/core/types"
import { isBookmarkable } from "@loomark/core/url"

export const readActiveTab = async (): Promise<ActiveTab | null> => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true })

  if (!tab || !isBookmarkable(tab.url)) {
    return null
  }

  return {
    id: tab.id ?? null,
    url: tab.url,
    title: tab.title?.trim() ?? "",
    faviconUrl: tab.favIconUrl ?? null,
  }
}
