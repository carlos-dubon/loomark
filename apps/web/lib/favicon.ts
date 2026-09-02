import { jsonError } from "@/lib/api"

const USER_AGENT =
  "Mozilla/5.0 (compatible; Loomark/1.0; +https://github.com/carlos-dubon/loomark)"

const MAX_FAVICON_BYTES = 1 * 1024 * 1024
const FETCH_TIMEOUT_MS = 8000

const isBlockedHostname = (hostname: string) => {
  const h = hostname.toLowerCase()

  if (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h === "::1" ||
    h === "[::1]" ||
    h === "169.254.169.254" ||
    h === "metadata.google.internal"
  ) {
    return true
  }

  if (h.endsWith(".localhost")) {
    return true
  }

  if (/^10\.\d+\.\d+\.\d+$/.test(h)) return true
  if (/^192\.168\.\d+\.\d+$/.test(h)) return true
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(h)) return true
  if (/^169\.254\.\d+\.\d+$/.test(h)) return true

  return false
}

export const faviconTarget = (urlParam: string | null) => {
  if (!urlParam) {
    return { target: null, error: jsonError("Missing url", 422) }
  }

  if (urlParam.length > 2000) {
    return { target: null, error: jsonError("URL too long", 422) }
  }

  if (urlParam.startsWith("data:")) {
    return { target: null, error: jsonError("data: URLs not proxied", 422) }
  }

  let target: URL

  try {
    target = new URL(urlParam)
  } catch {
    return { target: null, error: jsonError("Invalid URL", 422) }
  }

  if (!["http:", "https:"].includes(target.protocol)) {
    return { target: null, error: jsonError("Invalid protocol", 422) }
  }

  if (isBlockedHostname(target.hostname)) {
    return { target: null, error: jsonError("Blocked host", 403) }
  }

  return { target, error: null }
}

export const proxyFavicon = async (target: URL) => {
  try {
    const response = await fetch(target.toString(), {
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "user-agent": USER_AGENT,
        accept: "image/*,*/*;q=0.8",
      },
    })

    if (!response.ok || !response.body) {
      return jsonError("Failed to fetch favicon", 502)
    }

    const contentType =
      response.headers
        .get("content-type")
        ?.split(";")[0]
        ?.trim()
        .toLowerCase() ?? ""

    if (contentType.includes("text/html")) {
      return jsonError("Not an image", 502)
    }

    const isImage =
      !contentType ||
      contentType.startsWith("image/") ||
      contentType === "application/octet-stream" ||
      contentType.includes("icon")

    if (!isImage) {
      return jsonError("Not an image", 502)
    }

    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let received = 0

    while (received < MAX_FAVICON_BYTES) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) break
      received += value.byteLength
      if (received > MAX_FAVICON_BYTES) {
        await reader.cancel().catch(() => undefined)
        return jsonError("Favicon too large", 413)
      }
      chunks.push(value)
    }

    await reader.cancel().catch(() => undefined)

    const totalLength = chunks.reduce((acc, c) => acc + c.byteLength, 0)
    const body = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      body.set(chunk, offset)
      offset += chunk.byteLength
    }

    const headers = new Headers()
    headers.set("content-type", contentType || "image/x-icon")
    headers.set("content-length", String(totalLength))
    headers.set(
      "cache-control",
      "public, max-age=86400, stale-while-revalidate=604800"
    )
    headers.set("cross-origin-resource-policy", "cross-origin")
    headers.set("access-control-allow-origin", "*")
    headers.set("x-content-type-options", "nosniff")

    return new Response(body, {
      status: 200,
      headers,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return jsonError("Favicon fetch timed out", 504)
    }
    return jsonError("Failed to fetch favicon", 502)
  }
}
