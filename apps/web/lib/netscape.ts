import { decodeEntities, escapeHtml } from "@loomark/core/format"
export type NetscapeBookmark = {
  url: string
  title: string
  description: string | null
  faviconUrl: string | null
  addDate: Date | null
  pinned: boolean
}

export type NetscapeFolder = {
  name: string
  addDate: Date | null
  folders: NetscapeFolder[]
  bookmarks: NetscapeBookmark[]
}

const TAGS = /<(\/?)(dl|h3|a|dd)\b([^>]*)>/gi

const ATTRIBUTE = /([a-z_][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi

const MIN_YEAR = 1990

const MAX_YEAR = 2100

const emptyFolder = (
  name = "",
  addDate: Date | null = null
): NetscapeFolder => ({ name, addDate, folders: [], bookmarks: [] })

const readAttributes = (raw: string) => {
  const attributes: Record<string, string> = {}

  for (const match of raw.matchAll(ATTRIBUTE)) {
    attributes[match[1].toLowerCase()] = decodeEntities(
      match[2] ?? match[3] ?? match[4] ?? ""
    )
  }

  return attributes
}

const readDate = (value: string | undefined) => {
  if (!value) {
    return null
  }

  const seconds = Number.parseInt(value, 10)

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null
  }

  const date = new Date(seconds * 1000)
  const year = date.getUTCFullYear()

  return year >= MIN_YEAR && year <= MAX_YEAR ? date : null
}

const readInnerText = (html: string, from: number, tag: string) => {
  const closing = new RegExp(`</${tag}\\s*>`, "i")
  const rest = html.slice(from)
  const match = rest.match(closing)

  if (match?.index === undefined) {
    return {
      text: decodeEntities(rest.replace(/<[^>]*>/g, "")),
      end: html.length,
    }
  }

  return {
    text: decodeEntities(rest.slice(0, match.index).replace(/<[^>]*>/g, "")),
    end: from + match.index + match[0].length,
  }
}

const readFavicon = (attributes: Record<string, string>) => {
  const iconUri = attributes.icon_uri

  if (iconUri && /^https?:\/\//i.test(iconUri)) {
    return iconUri
  }

  const icon = attributes.icon

  if (icon && /^(https?:|data:image\/)/i.test(icon) && icon.length <= 2000) {
    return icon
  }

  return null
}

export const parseBookmarksFile = (html: string): NetscapeFolder => {
  const root = emptyFolder()
  const stack: NetscapeFolder[] = [root]

  let pending: NetscapeFolder | null = null
  let last: NetscapeBookmark | null = null
  let match: RegExpExecArray | null

  TAGS.lastIndex = 0

  while ((match = TAGS.exec(html)) !== null) {
    const closing = match[1] === "/"
    const tag = match[2].toLowerCase()

    if (tag === "dl") {
      if (closing) {
        if (stack.length > 1) {
          stack.pop()
        }

        pending = null
        last = null
        continue
      }

      const parent = stack[stack.length - 1]

      if (pending) {
        parent.folders.push(pending)
        stack.push(pending)
        pending = null
      } else {
        stack.push(parent)
      }

      continue
    }

    if (closing) {
      continue
    }

    const attributes = readAttributes(match[3])

    if (tag === "h3") {
      const { text, end } = readInnerText(html, TAGS.lastIndex, "h3")
      pending = emptyFolder(text, readDate(attributes.add_date))
      last = null
      TAGS.lastIndex = end
      continue
    }

    if (tag === "a") {
      const { text, end } = readInnerText(html, TAGS.lastIndex, "a")
      TAGS.lastIndex = end

      if (!attributes.href) {
        last = null
        continue
      }

      last = {
        url: attributes.href,
        title: text,
        description: null,
        faviconUrl: readFavicon(attributes),
        addDate: readDate(attributes.add_date),
        pinned: attributes.loomark_pinned === "true",
      }

      stack[stack.length - 1].bookmarks.push(last)
      continue
    }

    const boundary = html.indexOf("<", TAGS.lastIndex)
    const end = boundary === -1 ? html.length : boundary

    if (last) {
      last.description = decodeEntities(html.slice(TAGS.lastIndex, end)) || null
    }

    TAGS.lastIndex = end
  }

  return root
}

const toSeconds = (date: Date | null) =>
  date ? Math.floor(date.getTime() / 1000) : null

const attribute = (name: string, value: string | number | null) =>
  value === null || value === ""
    ? ""
    : ` ${name}="${escapeHtml(String(value))}"`

const writeBookmark = (bookmark: NetscapeBookmark, indent: string) => {
  const lines = [
    `${indent}<DT><A HREF="${escapeHtml(bookmark.url)}"` +
      attribute("ADD_DATE", toSeconds(bookmark.addDate)) +
      attribute("ICON", bookmark.faviconUrl) +
      (bookmark.pinned ? ' LOOMARK_PINNED="true"' : "") +
      `>${escapeHtml(bookmark.title)}</A>`,
  ]

  if (bookmark.description) {
    lines.push(`${indent}<DD>${escapeHtml(bookmark.description)}`)
  }

  return lines
}

const writeFolder = (folder: NetscapeFolder, depth: number): string[] => {
  const indent = "    ".repeat(depth)
  const lines: string[] = []

  for (const child of folder.folders) {
    lines.push(
      `${indent}<DT><H3` +
        attribute("ADD_DATE", toSeconds(child.addDate)) +
        `>${escapeHtml(child.name)}</H3>`,
      `${indent}<DL><p>`,
      ...writeFolder(child, depth + 1),
      `${indent}</DL><p>`
    )
  }

  for (const bookmark of folder.bookmarks) {
    lines.push(...writeBookmark(bookmark, indent))
  }

  return lines
}

export const buildBookmarksFile = (root: NetscapeFolder) =>
  [
    "<!DOCTYPE NETSCAPE-Bookmark-file-1>",
    "<!-- This is an automatically generated file.",
    "     It will not be changed unless you edit it. -->",
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    "<TITLE>Bookmarks</TITLE>",
    "<H1>Bookmarks</H1>",
    "<DL><p>",
    ...writeFolder(root, 1),
    "</DL><p>",
    "",
  ].join("\n")
