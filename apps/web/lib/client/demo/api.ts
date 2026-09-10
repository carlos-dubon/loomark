import { hostFromUrl, normalizeUrl } from "@loomark/core/url"
import type {
  BookmarkDTO,
  CollectionDeletion,
  UrlMetadata,
} from "@loomark/core/types"

import { demoBanner, demoFavicon } from "@/lib/client/demo/banner"
import { DemoUnavailableError } from "@/lib/demo/config"
import {
  collectionList,
  descendantIds,
  getState,
  newId,
  nextPinnedPosition,
  nextPosition,
  setState,
  unsortedId,
  withArtwork,
  type DemoState,
} from "@/lib/client/demo/store"
import type {
  AppearanceUpdateInput,
  BookmarkCreateInput,
  BookmarkReorderInput,
  BookmarkUpdateInput,
  CollectionCreateInput,
  CollectionMoveInput,
  CollectionUpdateInput,
} from "@/lib/schemas"

const LATENCY_MS = 140

const settle = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS))

const fail = (message: string): never => {
  throw new Error(message)
}

const requireBookmark = (current: DemoState, id: string) =>
  current.bookmarks.find((bookmark) => bookmark.id === id) ??
  fail("Bookmark not found")

const requireCollection = (current: DemoState, id: string) =>
  current.collections.find((collection) => collection.id === id) ??
  fail("Collection not found")

const matches = (bookmark: BookmarkDTO, query: string) => {
  const needle = query.toLowerCase()

  return (
    bookmark.title.toLowerCase().includes(needle) ||
    bookmark.url.toLowerCase().includes(needle) ||
    (bookmark.description?.toLowerCase().includes(needle) ?? false)
  )
}

const renumber = (current: DemoState) => {
  const byParent = new Map<string | null, typeof current.collections>()

  for (const collection of current.collections) {
    const siblings = byParent.get(collection.parentId) ?? []
    siblings.push(collection)
    byParent.set(collection.parentId, siblings)
  }

  const positions = new Map<string, number>()

  for (const siblings of byParent.values()) {
    siblings
      .slice()
      .sort((a, b) => a.position - b.position)
      .forEach((collection, index) => positions.set(collection.id, index))
  }

  return current.collections.map((collection) => ({
    ...collection,
    position: positions.get(collection.id) ?? collection.position,
  }))
}

export const demoApi = {
  listBookmarks: (
    query: {
      q?: string
      collectionId?: string
      pinned?: boolean
      unsorted?: boolean
      take?: number
    } = {}
  ) => {
    const current = getState()
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

    return settle(results.slice(0, query.take ?? 60))
  },

  createBookmark: (input: BookmarkCreateInput) => {
    const current = getState()
    const url = normalizeUrl(input.url)
    const collectionId = input.collectionId ?? unsortedId(current)
    const now = new Date().toISOString()

    const bookmark = withArtwork({
      id: newId("b"),
      url,
      title: input.title?.trim() || hostFromUrl(url),
      description: input.description ?? null,
      faviconUrl: input.faviconUrl ?? null,
      previewUrl: input.previewUrl ?? null,
      pinned: input.pinned ?? false,
      position: nextPosition(current, collectionId),
      pinnedPosition: input.pinned ? nextPinnedPosition(current) : 0,
      collectionId,
      createdAt: now,
      updatedAt: now,
    })

    setState((state) => ({
      ...state,
      bookmarks: [bookmark, ...state.bookmarks],
    }))

    return settle(bookmark)
  },

  updateBookmark: (id: string, input: BookmarkUpdateInput) => {
    const current = getState()
    const existing = requireBookmark(current, id)
    const pinning = input.pinned === true && !existing.pinned

    const updated = withArtwork({
      ...existing,
      ...(input.url ? { url: normalizeUrl(input.url) } : {}),
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.description === undefined
        ? {}
        : { description: input.description ?? null }),
      ...(input.collectionId ? { collectionId: input.collectionId } : {}),
      ...(input.pinned === undefined ? {} : { pinned: input.pinned }),
      ...(pinning ? { pinnedPosition: nextPinnedPosition(current) } : {}),
      updatedAt: new Date().toISOString(),
    })

    setState((state) => ({
      ...state,
      bookmarks: state.bookmarks.map((bookmark) =>
        bookmark.id === id ? updated : bookmark
      ),
    }))

    return settle(updated)
  },

  deleteBookmarks: (ids: string[]) => {
    const doomed = new Set(ids)

    setState((state) => ({
      ...state,
      bookmarks: state.bookmarks.filter((bookmark) => !doomed.has(bookmark.id)),
    }))

    return settle({ count: ids.length })
  },

  restoreBookmarks: (bookmarks: BookmarkDTO[]) => {
    setState((state) => {
      const known = new Set(state.bookmarks.map((bookmark) => bookmark.id))

      return {
        ...state,
        bookmarks: [
          ...bookmarks.filter((bookmark) => !known.has(bookmark.id)),
          ...state.bookmarks,
        ],
      }
    })

    return settle(bookmarks)
  },

  reorderBookmarks: (input: BookmarkReorderInput) => {
    const order = new Map(input.ids.map((id, index) => [id, index]))

    setState((state) => ({
      ...state,
      bookmarks: state.bookmarks.map((bookmark) => {
        const index = order.get(bookmark.id)

        if (index === undefined) {
          return bookmark
        }

        return input.scope === "pinned"
          ? { ...bookmark, pinnedPosition: index }
          : { ...bookmark, position: index }
      }),
    }))

    return settle<void>(undefined)
  },

  refreshPreview: (id: string) =>
    settle(withArtwork(requireBookmark(getState(), id))),

  listCollections: () => settle(collectionList(getState())),

  createCollection: (input: CollectionCreateInput) => {
    const current = getState()
    const parentId = input.parentId ?? null
    const siblings = current.collections.filter(
      (collection) => collection.parentId === parentId
    )

    const collection = {
      id: newId("c"),
      name: input.name,
      icon: input.icon ?? null,
      kind: "USER" as const,
      parentId,
      position: siblings.length,
      shareToken: null,
    }

    setState((state) => ({
      ...state,
      collections: [...state.collections, collection],
    }))

    return settle(
      collectionList(getState()).find((item) => item.id === collection.id) ??
        fail("Collection not found")
    )
  },

  updateCollection: (id: string, input: CollectionUpdateInput) => {
    const current = getState()
    const existing = requireCollection(current, id)

    if (existing.kind === "UNSORTED") {
      fail("Unsorted cannot be edited")
    }

    if (input.parentId && descendantIds(current, id).includes(input.parentId)) {
      fail("A collection cannot be moved into itself")
    }

    setState((state) => ({
      ...state,
      collections: state.collections.map((collection) =>
        collection.id === id
          ? {
              ...collection,
              ...(input.name === undefined ? {} : { name: input.name }),
              ...(input.icon === undefined ? {} : { icon: input.icon ?? null }),
              ...(input.parentId === undefined
                ? {}
                : { parentId: input.parentId ?? null }),
            }
          : collection
      ),
    }))

    return settle(
      collectionList(getState()).find((item) => item.id === id) ??
        fail("Collection not found")
    )
  },

  moveCollection: (input: CollectionMoveInput) => {
    const current = getState()
    const moving = requireCollection(current, input.id)

    if (moving.kind === "UNSORTED") {
      fail("Unsorted cannot be moved")
    }

    if (
      input.parentId &&
      descendantIds(current, input.id).includes(input.parentId)
    ) {
      fail("A collection cannot be moved into itself")
    }

    const destination = current.collections
      .filter(
        (collection) =>
          collection.parentId === input.parentId &&
          collection.id !== input.id &&
          collection.kind === "USER"
      )
      .sort((a, b) => a.position - b.position)

    const ordered = [
      ...destination.slice(0, input.index),
      moving,
      ...destination.slice(input.index),
    ]

    const positions = new Map(
      ordered.map((collection, index) => [collection.id, index])
    )

    setState((state) => ({
      ...state,
      collections: renumber({
        ...state,
        collections: state.collections.map((collection) =>
          collection.id === input.id
            ? {
                ...collection,
                parentId: input.parentId,
                position: positions.get(collection.id) ?? collection.position,
              }
            : {
                ...collection,
                position: positions.get(collection.id) ?? collection.position,
              }
        ),
      }),
    }))

    return settle(collectionList(getState()))
  },

  deleteCollection: (id: string) => {
    const current = getState()
    const existing = requireCollection(current, id)

    if (existing.kind === "UNSORTED") {
      fail("Unsorted cannot be deleted")
    }

    const doomed = new Set(descendantIds(current, id))
    const deletion: CollectionDeletion = {
      collections: collectionList(current).filter((collection) =>
        doomed.has(collection.id)
      ),
      bookmarks: current.bookmarks.filter((bookmark) =>
        doomed.has(bookmark.collectionId)
      ),
    }

    setState((state) => ({
      ...state,
      collections: state.collections.filter(
        (collection) => !doomed.has(collection.id)
      ),
      bookmarks: state.bookmarks.filter(
        (bookmark) => !doomed.has(bookmark.collectionId)
      ),
    }))

    return settle(deletion)
  },

  shareCollection: (id: string) => {
    const token = newId("s").replace("s-", "")
    const sharedAt = new Date().toISOString()

    setState((state) => ({
      ...state,
      collections: state.collections.map((collection) =>
        collection.id === id ? { ...collection, shareToken: token } : collection
      ),
    }))

    return settle({ id, shareToken: token, sharedAt })
  },

  unshareCollection: (id: string) => {
    setState((state) => ({
      ...state,
      collections: state.collections.map((collection) =>
        collection.id === id ? { ...collection, shareToken: null } : collection
      ),
    }))

    return settle({ id, shareToken: null, sharedAt: null })
  },

  restoreCollection: (deletion: CollectionDeletion) => {
    setState((state) => {
      const knownCollections = new Set(
        state.collections.map((collection) => collection.id)
      )
      const knownBookmarks = new Set(
        state.bookmarks.map((bookmark) => bookmark.id)
      )

      return {
        ...state,
        collections: [
          ...state.collections,
          ...deletion.collections
            .filter((collection) => !knownCollections.has(collection.id))
            .map((collection) => ({
              id: collection.id,
              name: collection.name,
              icon: collection.icon,
              kind: collection.kind,
              parentId: collection.parentId,
              position: collection.position,
              shareToken: collection.shareToken,
            })),
        ],
        bookmarks: [
          ...state.bookmarks,
          ...deletion.bookmarks.filter(
            (bookmark) => !knownBookmarks.has(bookmark.id)
          ),
        ],
      }
    })

    return settle(collectionList(getState()))
  },

  fetchMetadata: (url: string) => {
    const normalized = normalizeUrl(url)
    const host = hostFromUrl(normalized)
    const segments = new URL(normalized).pathname
      .split("/")
      .filter(Boolean)
      .join(" ")
      .replace(/[-_]+/g, " ")
      .replace(/\.\w+$/, "")
      .trim()

    const metadata: UrlMetadata = {
      url: normalized,
      title: segments
        ? `${segments.slice(0, 1).toUpperCase()}${segments.slice(1)}`
        : host,
      description: null,
      faviconUrl: demoFavicon(normalized),
      previewUrl: demoBanner(normalized),
    }

    return settle(metadata)
  },

  importBookmarks: () => {
    throw new DemoUnavailableError("Importing a bookmark file")
  },

  uploadAvatar: (file: File) =>
    new Promise<{ image: string }>((resolve, reject) => {
      const reader = new FileReader()

      reader.onerror = () => reject(new Error("Could not read that image"))
      reader.onload = () => {
        const image = String(reader.result)

        setState((state) => ({
          ...state,
          user: { ...state.user, image },
        }))

        resolve({ image })
      }

      reader.readAsDataURL(file)
    }),

  removeAvatar: () => {
    setState((state) => ({ ...state, user: { ...state.user, image: null } }))

    return settle({ image: null })
  },

  updateAppearance: (input: AppearanceUpdateInput) => {
    setState((state) => ({
      ...state,
      appearance: { ...state.appearance, ...input },
    }))

    return settle(getState().appearance)
  },

  resetUserPassword: () => {
    throw new DemoUnavailableError("Changing a password")
  },

  deleteUser: () => {
    throw new DemoUnavailableError("Deleting a user")
  },

  register: () => {
    throw new DemoUnavailableError("Creating an account")
  },
}
