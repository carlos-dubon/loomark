export const ARCHIVE_FORMATS = [
  "SCREENSHOT",
  "WEBPAGE",
  "PDF",
  "MARKDOWN",
] as const

export type ArchiveFormat = (typeof ARCHIVE_FORMATS)[number]

export const ARCHIVE_STATUSES = [
  "PENDING",
  "RUNNING",
  "READY",
  "FAILED",
] as const

export type ArchiveStatus = (typeof ARCHIVE_STATUSES)[number]

export const ARCHIVE_STAGES = [
  "LAUNCHING",
  "OPENING",
  "LOADING",
  "SETTLING",
  "EXPANDING",
  "CAPTURING",
  "SAVING",
] as const

export type ArchiveStage = (typeof ARCHIVE_STAGES)[number]

export type ArchiveSettings = Record<ArchiveFormat, boolean>

export type ArchiveUsage = { bytes: number; archives: number }

export type ArchiveClearResult = ArchiveUsage & { cleared: number }

export const EMPTY_ARCHIVE_USAGE: ArchiveUsage = { bytes: 0, archives: 0 }

export const DEFAULT_ARCHIVE_SETTINGS: ArchiveSettings = {
  SCREENSHOT: false,
  WEBPAGE: false,
  PDF: false,
  MARKDOWN: false,
}

export const ARCHIVE_LABELS: Record<ArchiveFormat, string> = {
  SCREENSHOT: "Screenshot",
  WEBPAGE: "Webpage",
  PDF: "PDF",
  MARKDOWN: "Markdown",
}

export const ARCHIVE_DESCRIPTIONS: Record<ArchiveFormat, string> = {
  SCREENSHOT: "A full length PNG of the page as it rendered.",
  WEBPAGE: "The page as one self contained HTML file, scripts stripped.",
  PDF: "A printable PDF, paginated the way the browser would print it.",
  MARKDOWN: "Just the article text, pulled out with Readability.",
}

export const ARCHIVE_EXTENSIONS: Record<ArchiveFormat, string> = {
  SCREENSHOT: "png",
  WEBPAGE: "html",
  PDF: "pdf",
  MARKDOWN: "md",
}

export const ARCHIVE_CONTENT_TYPES: Record<ArchiveFormat, string> = {
  SCREENSHOT: "image/png",
  WEBPAGE: "text/html; charset=utf-8",
  PDF: "application/pdf",
  MARKDOWN: "text/markdown; charset=utf-8",
}

export const ARCHIVE_SLUGS: Record<ArchiveFormat, string> = {
  SCREENSHOT: "screenshot",
  WEBPAGE: "webpage",
  PDF: "pdf",
  MARKDOWN: "markdown",
}

const BY_SLUG = new Map<string, ArchiveFormat>(
  ARCHIVE_FORMATS.map((format) => [ARCHIVE_SLUGS[format], format])
)

export const toArchiveFormat = (value: string): ArchiveFormat | null =>
  BY_SLUG.get(value.toLowerCase()) ?? null

export const enabledArchiveFormats = (settings: ArchiveSettings) =>
  ARCHIVE_FORMATS.filter((format) => settings[format])

export const ARCHIVE_STAGE_LABELS: Record<ArchiveStage, string> = {
  LAUNCHING: "Launching the browser",
  OPENING: "Opening a page",
  LOADING: "Loading the page",
  SETTLING: "Waiting for the page to settle",
  EXPANDING: "Scrolling to load the rest",
  CAPTURING: "Capturing",
  SAVING: "Saving to disk",
}

type Band = { from: number; to: number; pace: number }

const QUEUED_BAND: Band = { from: 0, to: 4, pace: 30000 }

const STAGE_BANDS: Record<ArchiveStage, Band> = {
  LAUNCHING: { from: 4, to: 12, pace: 4000 },
  OPENING: { from: 12, to: 20, pace: 1500 },
  LOADING: { from: 20, to: 38, pace: 6000 },
  SETTLING: { from: 38, to: 50, pace: 5000 },
  EXPANDING: { from: 50, to: 62, pace: 5000 },
  CAPTURING: { from: 62, to: 88, pace: 8000 },
  SAVING: { from: 88, to: 100, pace: 1500 },
}

const ease = ({ from, to, pace }: Band, elapsed: number) =>
  from + (to - from) * (1 - Math.exp(-Math.max(elapsed, 0) / pace))

export const archiveProgress = (
  status: ArchiveStatus,
  stage: ArchiveStage | null,
  elapsed = 0
) => {
  if (status === "READY" || status === "FAILED") {
    return 100
  }

  if (status === "PENDING") {
    return ease(QUEUED_BAND, elapsed)
  }

  return ease(stage ? STAGE_BANDS[stage] : QUEUED_BAND, elapsed)
}

export const isArchiveActive = (status: ArchiveStatus) =>
  status === "PENDING" || status === "RUNNING"

export const ARCHIVE_QUEUE_GROUPS = 50
