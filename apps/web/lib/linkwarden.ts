import type { NetscapeBookmark, NetscapeFolder } from "@/lib/netscape"

type LinkwardenLink = {
  id?: unknown
  name?: unknown
  url?: unknown
  description?: unknown
  metaDescription?: unknown
  createdAt?: unknown
  importDate?: unknown
}

type LinkwardenCollection = {
  id?: unknown
  name?: unknown
  parentId?: unknown
  createdAt?: unknown
  links?: unknown
}

type LinkwardenBackup = {
  collections?: unknown
  pinnedLinks?: unknown
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null

const asString = (value: unknown) => (typeof value === "string" ? value : null)

const asDate = (value: unknown) => {
  const raw = asString(value)

  if (!raw) {
    return null
  }

  const date = new Date(raw)

  return Number.isNaN(date.getTime()) ? null : date
}

const asKey = (value: unknown) =>
  typeof value === "number" || typeof value === "string" ? String(value) : null

export const isLinkwardenBackup = (value: unknown) => {
  const backup = asRecord(value)

  if (!backup || !Array.isArray(backup.collections)) {
    return false
  }

  return backup.collections.every((collection) => asRecord(collection) !== null)
}

const toBookmark = (
  link: LinkwardenLink,
  pinnedIds: Set<string>
): NetscapeBookmark | null => {
  const url = asString(link.url)

  if (!url) {
    return null
  }

  const id = asKey(link.id)

  return {
    url,
    title: asString(link.name)?.trim() || "",
    description:
      asString(link.description)?.trim() ||
      asString(link.metaDescription)?.trim() ||
      null,
    faviconUrl: null,
    addDate: asDate(link.importDate) ?? asDate(link.createdAt),
    pinned: id !== null && pinnedIds.has(id),
  }
}

export const parseLinkwardenBackup = (value: unknown): NetscapeFolder => {
  const backup = (asRecord(value) ?? {}) as LinkwardenBackup
  const root: NetscapeFolder = {
    name: "",
    addDate: null,
    folders: [],
    bookmarks: [],
  }

  const pinnedIds = new Set(
    (Array.isArray(backup.pinnedLinks) ? backup.pinnedLinks : [])
      .map((link) => asKey(asRecord(link)?.id))
      .filter((id) => id !== null)
  )

  const raw = (
    Array.isArray(backup.collections) ? backup.collections : []
  ).flatMap((entry) => {
    const collection = asRecord(entry) as LinkwardenCollection | null
    const id = collection ? asKey(collection.id) : null

    return collection && id ? [{ id, collection }] : []
  })

  const folders = new Map<string, NetscapeFolder>(
    raw.map(({ id, collection }) => [
      id,
      {
        name: asString(collection.name)?.trim() || "Imported",
        addDate: asDate(collection.createdAt),
        folders: [],
        bookmarks: [],
      },
    ])
  )

  const parents = new Map(
    raw.map(({ id, collection }) => [id, asKey(collection.parentId)])
  )

  const rooted = (id: string) => {
    const seen = new Set([id])

    let parentId = parents.get(id) ?? null

    while (parentId !== null && folders.has(parentId)) {
      if (seen.has(parentId)) {
        return null
      }

      seen.add(parentId)
      parentId = parents.get(parentId) ?? null
    }

    return parents.get(id) ?? null
  }

  for (const { id, collection } of raw) {
    const folder = folders.get(id)

    if (!folder) {
      continue
    }

    const parentId = rooted(id)
    const parent = (parentId ? folders.get(parentId) : null) ?? root

    parent.folders.push(folder)

    for (const entry of Array.isArray(collection.links)
      ? collection.links
      : []) {
      const link = asRecord(entry) as LinkwardenLink | null
      const bookmark = link ? toBookmark(link, pinnedIds) : null

      if (bookmark) {
        folder.bookmarks.push(bookmark)
      }
    }
  }

  return root
}
