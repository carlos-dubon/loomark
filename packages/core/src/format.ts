const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&nbsp;": " ",
}

export const decodeEntities = (value: string) =>
  value
    .replace(
      /&(amp|lt|gt|quot|apos|#39|nbsp);/g,
      (match) => ENTITIES[match] ?? match
    )
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    )
    .trim()

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"]

export const formatBytes = (bytes: number) => {
  if (bytes < 1) {
    return "0 B"
  }

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    BYTE_UNITS.length - 1
  )
  const value = bytes / 1024 ** exponent

  return `${value.toFixed(exponent === 0 || value >= 100 ? 0 : 1)} ${BYTE_UNITS[exponent]}`
}
