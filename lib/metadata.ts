import { decodeEntities, normalizeUrl } from "@/lib/format"
import type { UrlMetadata } from "@/lib/types"

const USER_AGENT =
  "Mozilla/5.0 (compatible; Loomark/1.0; +https://github.com/carlos-dubon/loomark)"

const MAX_BYTES = 512 * 1024

const readCapped = async (response: Response) => {
  const reader = response.body?.getReader()

  if (!reader) {
    return ""
  }

  const decoder = new TextDecoder()
  const chunks: string[] = []
  let received = 0

  while (received < MAX_BYTES) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    received += value.byteLength
    chunks.push(decoder.decode(value, { stream: true }))
  }

  await reader.cancel().catch(() => undefined)

  return chunks.join("")
}

const metaContent = (html: string, key: string) => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*?content=["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]*?(?:property|name)=["']${escaped}["']`,
      "i"
    ),
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)

    if (match?.[1]) {
      return decodeEntities(match[1])
    }
  }

  return null
}

const linkHref = (html: string, rels: string[]) => {
  for (const rel of rels) {
    const patterns = [
      new RegExp(
        `<link[^>]+rel=["'][^"']*${rel}[^"']*["'][^>]*?href=["']([^"']+)["']`,
        "i"
      ),
      new RegExp(
        `<link[^>]+href=["']([^"']+)["'][^>]*?rel=["'][^"']*${rel}[^"']*["']`,
        "i"
      ),
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)

      if (match?.[1]) {
        return decodeEntities(match[1])
      }
    }
  }

  return null
}

const absolute = (value: string | null, base: string) => {
  if (!value) {
    return null
  }

  try {
    const resolved = new URL(value, base)

    if (resolved.protocol === "data:" && !resolved.pathname.split(",")[1]) {
      return null
    }

    return resolved.toString()
  } catch {
    return null
  }
}

export const fetchUrlMetadata = async (
  rawUrl: string
): Promise<UrlMetadata> => {
  const url = normalizeUrl(rawUrl)
  const { hostname, origin } = new URL(url)
  const fallback: UrlMetadata = {
    url,
    title: hostname.replace(/^www\./, ""),
    description: null,
    faviconUrl: `${origin}/favicon.ico`,
    previewUrl: null,
  }

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml",
      },
    })

    if (
      !response.ok ||
      !response.headers.get("content-type")?.includes("html")
    ) {
      return fallback
    }

    const finalUrl = response.url || url
    const html = await readCapped(response)
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const title =
      metaContent(html, "og:title") ??
      (titleMatch?.[1] ? decodeEntities(titleMatch[1]) : null) ??
      fallback.title

    return {
      url,
      title: title.slice(0, 300),
      description:
        metaContent(html, "og:description")?.slice(0, 2000) ??
        metaContent(html, "description")?.slice(0, 2000) ??
        null,
      faviconUrl:
        absolute(
          linkHref(html, ["apple-touch-icon", "icon", "shortcut icon"]),
          finalUrl
        ) ?? fallback.faviconUrl,
      previewUrl:
        absolute(
          metaContent(html, "og:image") ?? metaContent(html, "twitter:image"),
          finalUrl
        ) ?? null,
    }
  } catch {
    return fallback
  }
}
