import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import sharp from "sharp"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

const MARK = {
  box: 512,
  stroke: 14,
  outer:
    "M168 189 L214 143 L258 143 L258 277 L298 277 L344 324 L344 351 A18 18 0 0 1 326 369 L186 369 A18 18 0 0 1 168 351 Z",
  inner: "M214 150 L214 326 L344 326",
  width: 190,
  height: 240,
}

const INK = "#1c1c1c"
const INK_DARK = "#f5f5f5"

const mark = ({ size, fill, color = INK, weight = MARK.stroke }) => {
  const scale = (fill * size) / MARK.height
  const offset = size / 2 - (MARK.box / 2) * scale

  return `<g transform="translate(${round(offset)} ${round(offset)}) scale(${round(scale, 5)})" fill="none" stroke="${color}" stroke-width="${weight}" stroke-linejoin="round"><path d="${MARK.outer}"/><path d="${MARK.inner}"/></g>`
}

const round = (n, digits = 2) => Number(n.toFixed(digits))

const squircle = (size, n = 5, samples = 160) => {
  const a = size / 2
  const points = []

  for (let i = 0; i < samples; i += 1) {
    const t = (i / samples) * Math.PI * 2
    const cos = Math.cos(t)
    const sin = Math.sin(t)
    const x = a + Math.sign(cos) * a * Math.abs(cos) ** (2 / n)
    const y = a + Math.sign(sin) * a * Math.abs(sin) ** (2 / n)
    points.push(`${round(x)} ${round(y)}`)
  }

  return `M${points.join("L")}Z`
}

const gradientDefs = (size) => `
    <linearGradient id="tile" x1="0" y1="0" x2="${round(size * 0.18)}" y2="${size}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.42" stop-color="#f7f7f7"/>
      <stop offset="1" stop-color="#dcdcdc"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="${round(size * 0.5)}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>`

const tile = ({
  size,
  shape,
  fill = 0.54,
}) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>${gradientDefs(size)}</defs>
  <path d="${shape}" fill="url(#tile)"/>
  <path d="${shape}" fill="url(#sheen)"/>
  <path d="${shape}" fill="none" stroke="#000000" stroke-opacity="0.07" stroke-width="${round(size / 256)}"/>
  ${mark({ size, fill })}
</svg>`

const square = (size) => `M0 0H${size}V${size}H0Z`

const png = async (svg, path, { opaque = false } = {}) => {
  const file = join(root, path)
  await mkdir(dirname(file), { recursive: true })

  let pipeline = sharp(Buffer.from(svg))
  if (opaque) pipeline = pipeline.flatten({ background: "#ffffff" })

  await pipeline.png({ compressionLevel: 9 }).toFile(file)
  console.log("  ✓", path)
}

const svgFile = async (svg, path) => {
  const file = join(root, path)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, `${svg}\n`)
  console.log("  ✓", path)
}

const ico = async (entries, path) => {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(entries.length, 4)

  let offset = 6 + entries.length * 16
  const directory = []
  const images = []

  for (const { size, data } of entries) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    directory.push(entry)
    images.push(data)
    offset += data.length
  }

  const file = join(root, path)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, Buffer.concat([header, ...directory, ...images]))
  console.log("  ✓", path)
}

const flat = (size, color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${mark({ size, fill: 0.68, color })}</svg>`

const rounded = (size) => tile({ size, shape: squircle(size) })
const gradient = (size) => tile({ size, shape: square(size) })

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <style>
    path { stroke: ${INK}; }
    @media (prefers-color-scheme: dark) { path { stroke: ${INK_DARK}; } }
  </style>
  <g fill="none" stroke-width="24" stroke-linejoin="round" transform="translate(-128 -128) scale(1.5)">
    <path d="${MARK.outer}"/>
    <path d="${MARK.inner}"/>
  </g>
</svg>`

const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="136 136 240 240" fill="none" stroke="currentColor" stroke-width="${MARK.stroke}" stroke-linejoin="round" role="img" aria-label="Loomark">
  <path d="${MARK.outer}"/>
  <path d="${MARK.inner}"/>
</svg>`

console.log("brand assets")

await svgFile(markSvg, "public/brand/loomark-mark.svg")
await svgFile(rounded(1024), "public/brand/loomark-icon.svg")
await svgFile(faviconSvg, "app/icon.svg")

for (const size of [256, 512, 1024]) {
  await png(flat(size, INK), `public/brand/loomark-flat-${size}.png`)
}
await png(flat(1024, INK_DARK), "public/brand/loomark-flat-1024-light.png")

for (const size of [512, 1024]) {
  await png(gradient(size), `public/brand/loomark-gradient-${size}.png`, {
    opaque: true,
  })
  await png(rounded(size), `public/brand/loomark-rounded-${size}.png`)
}

await png(rounded(192), "public/icons/icon-192.png")
await png(rounded(512), "public/icons/icon-512.png")
await png(
  tile({ size: 192, shape: square(192), fill: 0.44 }),
  "public/icons/maskable-192.png",
  { opaque: true }
)
await png(
  tile({ size: 512, shape: square(512), fill: 0.44 }),
  "public/icons/maskable-512.png",
  { opaque: true }
)

await png(gradient(180), "app/apple-icon.png", { opaque: true })

await ico(
  await Promise.all(
    [16, 32, 48].map(async (size) => ({
      size,
      data: await sharp(
        Buffer.from(faviconSvg.replace(`stroke: ${INK_DARK}`, `stroke: ${INK}`))
      )
        .resize(size, size)
        .png({ compressionLevel: 9 })
        .toBuffer(),
    }))
  ),
  "app/favicon.ico"
)
