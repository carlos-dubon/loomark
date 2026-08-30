export const normalizeUrl = (value: string) => {
  const trimmed = value.trim()
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  return new URL(withProtocol).toString()
}

export const safeNormalizeUrl = (value: string) => {
  try {
    const normalized = normalizeUrl(value)

    return /[%\s]/.test(new URL(normalized).hostname) ? null : normalized
  } catch {
    return null
  }
}

export const hostFromUrl = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export const isBookmarkable = (url: string | undefined): url is string =>
  typeof url === "string" && /^https?:\/\//i.test(url)

export const originPattern = (serverUrl: string) =>
  `${new URL(serverUrl).origin}/*`
