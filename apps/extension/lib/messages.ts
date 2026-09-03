import { browser } from "wxt/browser"

export type ExtensionMessage =
  { type: "bookmarks-changed" } | { type: "sync-now" }

const post = (message: ExtensionMessage) =>
  browser.runtime.sendMessage(message).catch(() => null)

export const notifyBookmarksChanged = () => post({ type: "bookmarks-changed" })

export const requestSync = () => post({ type: "sync-now" })
