import { accessSync, constants } from "node:fs"

import { chromium, type Browser } from "playwright-core"

const CANDIDATES = [
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
]

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--hide-scrollbars",
  "--mute-audio",
  "--no-first-run",
  "--disable-extensions",
  "--disable-background-networking",
]

export const chromiumPath = () => {
  const configured = process.env.CHROMIUM_PATH

  if (configured) {
    return configured
  }

  return CANDIDATES.find((candidate) => {
    try {
      accessSync(candidate, constants.X_OK)

      return true
    } catch {
      return false
    }
  })
}

export const launchBrowser = (): Promise<Browser> => {
  const executablePath = chromiumPath()

  if (!executablePath) {
    throw new Error(
      "No Chromium binary found. Install Chromium or set CHROMIUM_PATH."
    )
  }

  return chromium.launch({ executablePath, args: LAUNCH_ARGS })
}
