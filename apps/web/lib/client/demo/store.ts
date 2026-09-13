import "client-only"

import type {
  BookmarkDTO,
  CollectionDTO,
  CollectionKind,
} from "@loomark/core/types"

import { DEMO_UNSORTED_ID, DEMO_USER } from "@/lib/demo/config"
import { DEMO_BOOKMARKS, DEMO_COLLECTIONS } from "@/lib/client/demo/seed"
import type { BookmarkQuery } from "@/lib/query-keys"
import type { AppearanceDTO } from "@/lib/themes/appearance"
import { DEFAULT_APPEARANCE } from "@/lib/themes/appearance-defaults"

export type DemoCollectionRecord = {
  id: string
  name: string
  icon: string | null
  kind: CollectionKind
  parentId: string | null
  position: number
}

export type DemoState = {
  signedIn: boolean
  user: { name: string | null; email: string; image: string | null }
  appearance: AppearanceDTO
  collections: DemoCollectionRecord[]
  bookmarks: BookmarkDTO[]
}

const DAY_MS = 86_400_000

const timestamp = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * DAY_MS).toISOString()

const seedState = (): DemoState => {
  const bookmarks = DEMO_BOOKMARKS.map((seed) => ({
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
  }))

  return {
    signedIn: false,
    user: {
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      image: DEMO_USER.image,
    },
    appearance: { ...DEFAULT_APPEARANCE },
    collections: DEMO_COLLECTIONS.map((collection) => ({ ...collection })),
    bookmarks,
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

export const signIn = () =>
  setState((current) => ({ ...current, signedIn: true }))

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
    tally.set(
      bookmark.collectionId,
      (tally.get(bookmark.collectionId) ?? 0) + 1
    )
  }

  const list = current.collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    icon: collection.icon,
    kind: collection.kind,
    position: collection.position,
    parentId: collection.parentId,
    bookmarkCount: tally.get(collection.id) ?? 0,
  }))

  counts.set(current, list)

  return list
}

const matches = (bookmark: BookmarkDTO, query: string) => {
  const needle = query.toLowerCase()

  return (
    bookmark.title.toLowerCase().includes(needle) ||
    bookmark.url.toLowerCase().includes(needle) ||
    (bookmark.description?.toLowerCase().includes(needle) ?? false)
  )
}

export const queryBookmarks = (current: DemoState, query: BookmarkQuery) => {
  const unsorted = unsortedId(current)

  let results = current.bookmarks

  if (query.pinned) {
    results = results.filter((bookmark) => bookmark.pinned)
  }

  if (query.unsorted) {
    results = results.filter((bookmark) => bookmark.collectionId === unsorted)
  }

  if (query.collectionId) {
    results = results.filter(
      (bookmark) => bookmark.collectionId === query.collectionId
    )
  }

  if (query.q) {
    results = results.filter((bookmark) => matches(bookmark, query.q ?? ""))
  }

  return results.slice(0, query.take ?? 60)
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
  current.collections.find((collection) => collection.kind === "UNSORTED")
    ?.id ?? DEMO_UNSORTED_ID

export const shiftPositions = (
  bookmarks: BookmarkDTO[],
  collectionId: string
) =>
  bookmarks.map((bookmark) =>
    bookmark.collectionId === collectionId
      ? { ...bookmark, position: bookmark.position + 1 }
      : bookmark
  )

export const nextPinnedPosition = (current: DemoState) =>
  current.bookmarks.reduce(
    (highest, bookmark) =>
      bookmark.pinned
        ? Math.max(highest, bookmark.pinnedPosition + 1)
        : highest,
    0
  )

export const newId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`
