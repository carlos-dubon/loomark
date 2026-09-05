import { hostFromUrl } from "@loomark/core/url"

const hash = (value: string) => {
  let result = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }

  return Math.abs(result)
}

const paletteFor = (seed: string) => {
  const hue = hash(seed) % 360

  return {
    from: `hsl(${hue} 68% 46%)`,
    to: `hsl(${(hue + 42) % 360} 72% 28%)`,
    glow: `hsl(${(hue + 180) % 360} 90% 72%)`,
  }
}

const initials = (host: string) => {
  const label = host.replace(/^www\./, "").split(".")[0] ?? host
  const parts = label.split(/[-_]/).filter(Boolean)

  return (
    parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`
      : label.slice(0, 2)
  ).toUpperCase()
}

const encode = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`

export const demoBanner = (url: string) => {
  const host = hostFromUrl(url) || "loomark"
  const { from, to, glow } = paletteFor(host)
  const label = host.replace(/^www\./, "")

  return encode(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${from}"/>
          <stop offset="100%" stop-color="${to}"/>
        </linearGradient>
        <radialGradient id="s" cx="18%" cy="16%" r="72%">
          <stop offset="0%" stop-color="${glow}" stop-opacity="0.42"/>
          <stop offset="100%" stop-color="${glow}" stop-opacity="0"/>
        </radialGradient>
        <pattern id="p" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M48 0H0V48" fill="none" stroke="#fff" stroke-opacity="0.06" stroke-width="1.5"/>
        </pattern>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <rect width="1200" height="630" fill="url(#p)"/>
      <rect width="1200" height="630" fill="url(#s)"/>
      <text x="600" y="352" text-anchor="middle" fill="#fff" fill-opacity="0.16"
        font-family="ui-sans-serif, -apple-system, Segoe UI, Roboto, sans-serif"
        font-size="300" font-weight="700" letter-spacing="-12">${initials(host)}</text>
      <text x="72" y="556" fill="#fff" fill-opacity="0.92"
        font-family="ui-sans-serif, -apple-system, Segoe UI, Roboto, sans-serif"
        font-size="38" font-weight="600" letter-spacing="-0.5">${label}</text>
    </svg>
  `)
}

export const demoFavicon = (url: string) => {
  const host = hostFromUrl(url) || "loomark"
  const { from, to } = paletteFor(host)

  return encode(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${from}"/>
          <stop offset="100%" stop-color="${to}"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#g)"/>
      <text x="32" y="43" text-anchor="middle" fill="#fff"
        font-family="ui-sans-serif, -apple-system, Segoe UI, Roboto, sans-serif"
        font-size="30" font-weight="700">${initials(host).slice(0, 1)}</text>
    </svg>
  `)
}
