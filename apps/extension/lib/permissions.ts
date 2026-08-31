import { browser } from "wxt/browser"

import { originPattern } from "@loomark/core/url"

export const hasHostPermission = (serverUrl: string) =>
  browser.permissions.contains({ origins: [originPattern(serverUrl)] })

export const requestHostPermission = (serverUrl: string) =>
  browser.permissions.request({ origins: [originPattern(serverUrl)] })
