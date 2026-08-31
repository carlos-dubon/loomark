import { browser } from "wxt/browser"

export type ExtensionMessage = { type: "bookmarks-changed" }

export const notifyBookmarksChanged = () =>
  browser.runtime
    .sendMessage({ type: "bookmarks-changed" } satisfies ExtensionMessage)
    .catch(() => null)
