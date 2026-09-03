import { browser } from "wxt/browser"
import { defineBackground } from "wxt/utils/define-background"

import { isBookmarkable } from "@loomark/core/url"

import { lookupBookmark, type Auth } from "@/lib/api"
import type { ExtensionMessage } from "@/lib/messages"
import {
  readConnection,
  readSyncSettings,
  watchConnection,
  watchSyncSettings,
  writeSyncSettings,
} from "@/lib/storage"
import { runSync } from "@/lib/sync"

const CACHE_TTL = 5 * 60 * 1000
const BADGE_COLOR = "#16a34a"
const SYNC_ALARM = "loomark-sync"
const SYNC_PERIOD_MINUTES = 3

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

  const scheduleSync = async () => {
    const { enabled, rootId } = await readSyncSettings()

    if (!enabled || !rootId) {
      await browser.alarms.clear(SYNC_ALARM)
      return
    }

    if (!(await browser.alarms.get(SYNC_ALARM))) {
      browser.alarms.create(SYNC_ALARM, {
        periodInMinutes: SYNC_PERIOD_MINUTES,
      })
    }
  }

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === SYNC_ALARM) {
      void runSync()
    }
  })

  browser.permissions.onRemoved.addListener((permissions) => {
    if (permissions.permissions?.includes("bookmarks")) {
      void readSyncSettings().then((settings) =>
        settings.enabled
          ? writeSyncSettings({ ...settings, enabled: false })
          : null
      )
    }
  })

  browser.runtime.onMessage.addListener((message: ExtensionMessage) => {
    if (message?.type === "bookmarks-changed") {
      cache.clear()
      void refreshVisibleTabs()
      void runSync()
    }

    if (message?.type === "sync-now") {
      void runSync()
    }
  })

  watchConnection(() => {
    cache.clear()
    void refreshVisibleTabs()
  })

  watchSyncSettings(() => {
    void scheduleSync()
  })

  void refreshVisibleTabs()
  void scheduleSync()
})
