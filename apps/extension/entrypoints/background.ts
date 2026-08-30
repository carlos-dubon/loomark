import { browser } from "wxt/browser"
import { defineBackground } from "wxt/utils/define-background"

import { lookupBookmark, type Auth } from "@/lib/api"
import type { ExtensionMessage } from "@/lib/messages"
import { readConnection, watchConnection } from "@/lib/storage"
import { isBookmarkable } from "@/lib/url"

const CACHE_TTL = 5 * 60 * 1000
const BADGE_COLOR = "#16a34a"

type CacheEntry = { saved: boolean; at: number }

export default defineBackground(() => {
  const cache = new Map<string, CacheEntry>()

  const auth = async (): Promise<Auth | null> => {
    const connection = await readConnection()

    return connection
      ? { serverUrl: connection.serverUrl, token: connection.token }
      : null
  }

  const paint = (tabId: number, saved: boolean) => {
    void browser.action.setBadgeText({ tabId, text: saved ? "✓" : "" })
    void browser.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR })
  }

  const refresh = async (tabId: number, url: string | undefined) => {
    if (!isBookmarkable(url)) {
      paint(tabId, false)
      return
    }

    const cached = cache.get(url)

    if (cached && Date.now() - cached.at < CACHE_TTL) {
      paint(tabId, cached.saved)
      return
    }

    const credentials = await auth()

    if (!credentials) {
      paint(tabId, false)
      return
    }

    try {
      const saved = Boolean(await lookupBookmark(credentials, url))

      cache.set(url, { saved, at: Date.now() })
      paint(tabId, saved)
    } catch {
      paint(tabId, false)
    }
  }

  const refreshVisibleTabs = async () => {
    const tabs = await browser.tabs.query({ active: true })

    await Promise.all(
      tabs.map((tab) =>
        tab.id === undefined ? null : refresh(tab.id, tab.url)
      )
    )
  }

  browser.tabs.onActivated.addListener(({ tabId }) => {
    void browser.tabs
      .get(tabId)
      .then((tab) => refresh(tabId, tab.url))
      .catch(() => null)
  })

  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.status === "complete") {
      void refresh(tabId, changeInfo.url ?? tab.url)
    }
  })

  browser.runtime.onMessage.addListener((message: ExtensionMessage) => {
    if (message?.type === "bookmarks-changed") {
      cache.clear()
      void refreshVisibleTabs()
    }
  })

  watchConnection(() => {
    cache.clear()
    void refreshVisibleTabs()
  })

  void refreshVisibleTabs()
})
