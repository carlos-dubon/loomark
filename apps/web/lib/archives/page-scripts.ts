export const AUTO_SCROLL = () =>
  new Promise<void>((resolve) => {
    const step = Math.max(200, window.innerHeight * 0.8)
    let travelled = 0

    const tick = () => {
      const height = document.documentElement.scrollHeight

      window.scrollBy(0, step)
      travelled += step

      if (travelled >= height || travelled > 40000) {
        window.scrollTo(0, 0)
        setTimeout(resolve, 250)

        return
      }

      setTimeout(tick, 80)
    }

    tick()
  })

export const PAGE_METRICS = () => ({
  width: Math.max(
    document.documentElement.scrollWidth,
    document.body?.scrollWidth ?? 0,
    window.innerWidth
  ),
  height: Math.max(
    document.documentElement.scrollHeight,
    document.body?.scrollHeight ?? 0,
    window.innerHeight
  ),
})

export const READ_ARTICLE = () => {
  const parser = (
    window as unknown as {
      Readability?: new (
        doc: Document,
        options?: unknown
      ) => { parse: () => { title?: string; content?: string } | null }
    }
  ).Readability

  if (!parser) {
    return null
  }

  return new parser(document.cloneNode(true) as Document).parse()
}

export const INLINE_PAGE = async (budget: number) => {
  const PER_ASSET_LIMIT = 2 * 1024 * 1024
  let remaining = budget

  const cache = new Map<string, string | null>()

  const toDataUri = async (raw: string) => {
    let absolute: string

    try {
      absolute = new URL(raw, document.baseURI).toString()
    } catch {
      return null
    }

    if (absolute.startsWith("data:")) {
      return absolute
    }

    if (!absolute.startsWith("http")) {
      return null
    }

    const cached = cache.get(absolute)

    if (cached !== undefined) {
      return cached
    }

    if (remaining <= 0) {
      return null
    }

    try {
      const response = await fetch(absolute, { credentials: "omit" })

      if (!response.ok) {
        cache.set(absolute, null)

        return null
      }

      const blob = await response.blob()

      if (blob.size > PER_ASSET_LIMIT || blob.size > remaining) {
        cache.set(absolute, null)

        return null
      }

      remaining -= blob.size

      const encoded = await new Promise<string | null>((resolve) => {
        const reader = new FileReader()

        reader.onload = () =>
          resolve(typeof reader.result === "string" ? reader.result : null)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })

      cache.set(absolute, encoded)

      return encoded
    } catch {
      cache.set(absolute, null)

      return null
    }
  }

  const absolutize = (raw: string) => {
    try {
      return new URL(raw, document.baseURI).toString()
    } catch {
      return raw
    }
  }

  const inlineCss = async (css: string, base: string) => {
    const references = [...css.matchAll(/url\((['"]?)([^'")]+)\1\)/g)]
    let output = css

    for (const [match, , reference] of references) {
      if (!reference || reference.startsWith("data:")) {
        continue
      }

      let resolved: string

      try {
        resolved = new URL(reference, base).toString()
      } catch {
        continue
      }

      const encoded = await toDataUri(resolved)

      output = output.split(match).join(`url("${encoded ?? resolved}")`)
    }

    return output
  }

  for (const node of [...document.querySelectorAll("script, noscript")]) {
    node.remove()
  }

  for (const node of [...document.querySelectorAll<HTMLElement>("*")]) {
    for (const attribute of [...node.attributes]) {
      if (attribute.name.startsWith("on")) {
        node.removeAttribute(attribute.name)
      }
    }
  }

  for (const sheet of [
    ...document.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]'),
  ]) {
    const href = sheet.href

    if (!href) {
      sheet.remove()

      continue
    }

    try {
      const response = await fetch(href, { credentials: "omit" })
      const text = response.ok ? await response.text() : ""
      const style = document.createElement("style")

      style.textContent = await inlineCss(text, href)
      sheet.replaceWith(style)
    } catch {
      sheet.remove()
    }
  }

  for (const style of [...document.querySelectorAll("style")]) {
    style.textContent = await inlineCss(
      style.textContent ?? "",
      document.baseURI
    )
  }

  for (const image of [...document.querySelectorAll<HTMLImageElement>("img")]) {
    image.removeAttribute("srcset")
    image.removeAttribute("loading")

    const source = image.getAttribute("src")

    if (!source) {
      continue
    }

    image.setAttribute("src", (await toDataUri(source)) ?? absolutize(source))
  }

  for (const source of [
    ...document.querySelectorAll<HTMLSourceElement>("source"),
  ]) {
    source.remove()
  }

  for (const anchor of [
    ...document.querySelectorAll<HTMLAnchorElement>("a[href]"),
  ]) {
    anchor.setAttribute("href", absolutize(anchor.getAttribute("href") ?? ""))
  }

  const head = document.head

  if (head) {
    for (const existing of [...head.querySelectorAll("base")]) {
      existing.remove()
    }

    const base = document.createElement("base")

    base.setAttribute("href", document.baseURI)
    head.prepend(base)
  }

  return `<!doctype html>\n${document.documentElement.outerHTML}`
}
