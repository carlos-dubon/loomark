import {
  DEFAULT_ARCHIVE_SETTINGS,
  type ArchiveFormat,
  type ArchiveSettings,
  type ArchiveStage,
  type ArchiveStatus,
} from "@loomark/core/archive"
import type {
  BookmarkDTO,
  CollectionDTO,
  CollectionKind,
} from "@loomark/core/types"

import { demoBanner, demoFavicon } from "@/lib/demo/banner"
import { DEMO_UNSORTED_ID, DEMO_USER } from "@/lib/demo/config"
import { DEMO_BOOKMARKS, DEMO_COLLECTIONS } from "@/lib/demo/seed"
import type { AppearanceDTO } from "@/lib/themes/appearance"
import { DEFAULT_APPEARANCE } from "@/lib/themes/appearance-defaults"

export type DemoCollectionRecord = {
  id: string
  name: string
  icon: string | null
  kind: CollectionKind
  parentId: string | null
  position: number
  shareToken: string | null
}

export type DemoArchiveRecord = {
  bookmarkId: string
  format: ArchiveFormat
  status: ArchiveStatus
  stage: ArchiveStage | null
  bytes: number
  error: string | null
  updatedAt: string
  queuedAt: string
}

export type DemoState = {
  signedIn: boolean
  user: { name: string | null; email: string; image: string | null }
  appearance: AppearanceDTO
  collections: DemoCollectionRecord[]
  bookmarks: BookmarkDTO[]
  archives: DemoArchiveRecord[]
  archiveSettings: ArchiveSettings
}

const DAY_MS = 86_400_000

const timestamp = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * DAY_MS).toISOString()

export const withArtwork = (bookmark: BookmarkDTO): BookmarkDTO => ({
  ...bookmark,
  previewUrl: bookmark.previewUrl ?? demoBanner(bookmark.url),
  faviconUrl: bookmark.faviconUrl ?? demoFavicon(bookmark.url),
})

const seedState = (): DemoState => {
  const bookmarks = DEMO_BOOKMARKS.map((seed) =>
    withArtwork({
      id: seed.id,
      url: seed.url,
      title: seed.title,
      description: seed.description,
      faviconUrl: seed.faviconUrl,
      previewUrl: seed.previewUrl,
      pinned: seed.pinned,
      position: seed.position,
      pinnedPosition: seed.pinnedPosition,
      collectionId: seed.collectionId,
      createdAt: timestamp(seed.daysAgo),
      updatedAt: timestamp(seed.daysAgo),
    })
  )

  const archives = DEMO_BOOKMARKS.flatMap((seed) =>
    seed.archives.map((archive) => ({
      bookmarkId: seed.id,
      format: archive.format,
      status: "READY" as ArchiveStatus,
      stage: null,
      bytes: archive.bytes,
      error: null,
      updatedAt: timestamp(seed.daysAgo),
      queuedAt: timestamp(seed.daysAgo),
    }))
  )

  return {
    signedIn: false,
    user: { name: DEMO_USER.name, email: DEMO_USER.email, image: null },
    appearance: { ...DEFAULT_APPEARANCE },
    collections: DEMO_COLLECTIONS.map((collection) => ({ ...collection })),
    bookmarks,
    archives,
    archiveSettings: {
      ...DEFAULT_ARCHIVE_SETTINGS,
      SCREENSHOT: true,
      WEBPAGE: true,
      MARKDOWN: true,
    },
  }
}

let state = seedState()

const listeners = new Set<() => void>()

export const subscribe = (listener: () => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export const getState = () => state

export const setState = (next: (current: DemoState) => DemoState) => {
  state = next(state)

  for (const listener of listeners) {
    listener()
  }
}

export const signIn = () => setState((current) => ({ ...current, signedIn: true }))

export const signOut = () => {
  state = seedState()

  for (const listener of listeners) {
    listener()
  }
}

const counts = new WeakMap<DemoState, CollectionDTO[]>()

export const collectionList = (current: DemoState) => {
  const cached = counts.get(current)

  if (cached) {
    return cached
  }

  const tally = new Map<string, number>()

  for (const bookmark of current.bookmarks) {
    tally.set(bookmark.collectionId, (tally.get(bookmark.collectionId) ?? 0) + 1)
  }

  const list = current.collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    icon: collection.icon,
    kind: collection.kind,
    position: collection.position,
    parentId: collection.parentId,
    bookmarkCount: tally.get(collection.id) ?? 0,
    shareToken: collection.shareToken,
  }))

  counts.set(current, list)

  return list
}

const pinnedCache = new WeakMap<DemoState, BookmarkDTO[]>()

export const pinnedBookmarks = (current: DemoState) => {
  const cached = pinnedCache.get(current)

  if (cached) {
    return cached
  }

  const list = current.bookmarks.filter((bookmark) => bookmark.pinned)

  pinnedCache.set(current, list)

  return list
}

const collectionCache = new WeakMap<DemoState, Map<string, BookmarkDTO[]>>()

export const bookmarksIn = (current: DemoState, collectionId: string) => {
  const cache =
    collectionCache.get(current) ?? new Map<string, BookmarkDTO[]>()

  if (!collectionCache.has(current)) {
    collectionCache.set(current, cache)
  }

  const cached = cache.get(collectionId)

  if (cached) {
    return cached
  }

  const list = current.bookmarks.filter(
    (bookmark) => bookmark.collectionId === collectionId
  )

  cache.set(collectionId, list)

  return list
}

export const descendantIds = (current: DemoState, id: string) => {
  const ids = [id]
  let cursor = 0

  while (cursor < ids.length) {
    const parentId = ids[cursor]
    cursor += 1

    for (const collection of current.collections) {
      if (collection.parentId === parentId && !ids.includes(collection.id)) {
        ids.push(collection.id)
      }
    }
  }

  return ids
}

export const unsortedId = (current: DemoState) =>
  current.collections.find((collection) => collection.kind === "UNSORTED")?.id ??
  DEMO_UNSORTED_ID

export const nextPosition = (current: DemoState, collectionId: string) =>
  bookmarksIn(current, collectionId).reduce(
    (highest, bookmark) => Math.max(highest, bookmark.position + 1),
    0
  )

export const nextPinnedPosition = (current: DemoState) =>
  current.bookmarks.reduce(
    (highest, bookmark) =>
      bookmark.pinned ? Math.max(highest, bookmark.pinnedPosition + 1) : highest,
    0
  )

export const newId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`

export const archiveUsage = (current: DemoState) => ({
  bytes: current.archives.reduce(
    (total, archive) =>
      archive.status === "READY" ? total + archive.bytes : total,
    0
  ),
  archives: current.archives.filter((archive) => archive.status === "READY")
    .length,
})
