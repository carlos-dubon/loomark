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

export type ArchiveSettings = Record<ArchiveFormat, boolean>

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
