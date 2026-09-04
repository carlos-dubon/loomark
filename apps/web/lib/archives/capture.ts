import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"
import { pathToFileURL } from "node:url"

import type { Browser, Page } from "playwright-core"
import TurndownService from "turndown"

import {
  ARCHIVE_FORMATS,
  type ArchiveFormat,
  type ArchiveStage,
} from "@loomark/core/archive"

import {
  AUTO_SCROLL,
  INLINE_PAGE,
  PAGE_METRICS,
  READ_ARTICLE,
} from "@/lib/archives/page-scripts"

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

const NAVIGATION_TIMEOUT = 45000
const SETTLE_TIMEOUT = 8000
const MAX_SCREENSHOT_HEIGHT = 20000
const INLINE_BUDGET = 24 * 1024 * 1024

const CAPTURE_ORDER: ArchiveFormat[] = [
  "SCREENSHOT",
  "PDF",
  "MARKDOWN",
  "WEBPAGE",
]

export type CaptureOutcome =
  | { format: ArchiveFormat; data: Buffer }
  | { format: ArchiveFormat; error: string }

export type CaptureRequest = {
  url: string
  formats: ArchiveFormat[]
  onStage: (formats: ArchiveFormat[], stage: ArchiveStage) => Promise<unknown>
  stillWanted: () => Promise<ArchiveFormat[]>
}

let readability: string | null = null

const readabilitySource = async () => {
  if (readability === null) {
    const resolve = createRequire(
      pathToFileURL(path.join(process.cwd(), "package.json"))
    ).resolve

    readability = await readFile(
      resolve("@mozilla/readability/Readability.js"),
      "utf8"
    )
  }

  return readability
}

const captureScreenshot = async (page: Page) => {
  const metrics = await page.evaluate(PAGE_METRICS)

  if (metrics.height <= MAX_SCREENSHOT_HEIGHT) {
    return page.screenshot({ fullPage: true, type: "png" })
  }

  return page.screenshot({
    type: "png",
    clip: {
      x: 0,
      y: 0,
      width: metrics.width,
      height: MAX_SCREENSHOT_HEIGHT,
    },
  })
}

const capturePdf = (page: Page) =>
  page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", bottom: "12mm", left: "10mm", right: "10mm" },
  })

const captureMarkdown = async (page: Page, url: string) => {
  await page.addScriptTag({ content: await readabilitySource() })

  const article = await page.evaluate(READ_ARTICLE)
  const title = article?.title?.trim() || (await page.title()) || url

  const html =
    article?.content ??
    (await page.evaluate(() => document.body?.innerHTML ?? ""))

  if (!html.trim()) {
    throw new Error("No readable content on the page")
  }

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  })

  turndown.remove(["script", "style"])

  const frontMatter = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `url: ${url}`,
    `archived: ${new Date().toISOString()}`,
    "---",
    "",
  ].join("\n")

  return Buffer.from(`${frontMatter}${turndown.turndown(html)}\n`, "utf8")
}

const captureWebpage = async (page: Page) =>
  Buffer.from(await page.evaluate(INLINE_PAGE, INLINE_BUDGET), "utf8")

const captureOne = async (page: Page, url: string, format: ArchiveFormat) => {
  if (format === "SCREENSHOT") {
    return captureScreenshot(page)
  }

  if (format === "PDF") {
    return capturePdf(page)
  }

  if (format === "MARKDOWN") {
    return captureMarkdown(page, url)
  }

  return captureWebpage(page)
}

export const captureBookmark = async (
  browser: Browser,
  { url, formats, onStage, stillWanted }: CaptureRequest
): Promise<CaptureOutcome[]> => {
  const wanted = CAPTURE_ORDER.filter((format) => formats.includes(format))

  if (wanted.length === 0) {
    return []
  }

  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1440, height: 1080 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    locale: "en-US",
    javaScriptEnabled: true,
  })

  try {
    const page = await context.newPage()

    page.setDefaultTimeout(NAVIGATION_TIMEOUT)

    await onStage(wanted, "LOADING")

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: NAVIGATION_TIMEOUT,
    })

    const settling = await stillWanted()

    if (settling.length === 0) {
      return []
    }

    await onStage(settling, "SETTLING")

    await page
      .waitForLoadState("networkidle", { timeout: SETTLE_TIMEOUT })
      .catch(() => undefined)

    await page.evaluate(AUTO_SCROLL).catch(() => undefined)

    const outcomes: CaptureOutcome[] = []

    for (const format of wanted) {
      if (!(await stillWanted()).includes(format)) {
        continue
      }

      await onStage([format], "CAPTURING")

      try {
        outcomes.push({ format, data: await captureOne(page, url, format) })
      } catch (cause) {
        outcomes.push({
          format,
          error: cause instanceof Error ? cause.message : "Capture failed",
        })
      }
    }

    return outcomes
  } finally {
    await context.close().catch(() => undefined)
  }
}

export const isArchiveFormat = (value: string): value is ArchiveFormat =>
  (ARCHIVE_FORMATS as readonly string[]).includes(value)
