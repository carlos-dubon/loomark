import type {
  SyncBookmark,
  SyncCollection,
  SyncOrderGroup,
  SyncSnapshot,
} from "@loomark/core/types"
import { normalizeUrl } from "@loomark/core/url"

import {
  createBookmark as createRemoteBookmark,
  createCollection as createRemoteCollection,
  deleteBookmark as deleteRemoteBookmark,
  deleteCollection as deleteRemoteCollection,
  fetchSyncSnapshot,
  isOffline,
  isUnauthorized,
  pushSyncOrder,
  updateBookmark as updateRemoteBookmark,
  updateCollection as updateRemoteCollection,
  type Auth,
} from "@/lib/api"
import {
  createFolder,
  createLink,
  defaultRootId,
  hasBookmarksPermission,
  moveNode,
  readSubtree,
  removeFolder,
  removeLink,
  renameNode,
  retargetLink,
  type NativeNode,
} from "@/lib/bookmarks"
import {
  readConnection,
  readSyncLinks,
  readSyncSettings,
  readSyncStatus,
  writeSyncLinks,
  writeSyncSettings,
  writeSyncStatus,
  type SyncLink,
  type SyncStatus,
} from "@/lib/storage"

const MAX_REMOTE_WRITES = 200
const MAX_NAME = 80
const MAX_TITLE = 300

const keyOf = (kind: SyncLink["kind"], loomarkId: string) =>
  `${kind}:${loomarkId}`

const rethrowFatal = (cause: unknown) => {
  if (isUnauthorized(cause) || isOffline(cause)) {
    throw cause
  }
}

const sameUrl = (a: string, b: string) => {
  try {
    return normalizeUrl(a) === normalizeUrl(b)
  } catch {
    return a === b
  }
}

const clamp = (value: string, max: number) => value.trim().slice(0, max)

const UNRANKED = Number.MAX_SAFE_INTEGER
const PINNED = Number.MIN_SAFE_INTEGER
const KINDS = ["collection", "bookmark"] as const

const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

const sequence = (links: SyncLink[]) => links.map((link) => link.loomarkId)

const same = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index])

const reconcile = async (
  auth: Auth,
  rootId: string,
  remote: SyncSnapshot,
  nodeList: NativeNode[],
  stored: SyncLink[]
) => {
  const collections = new Map(
    remote.collections.map((collection) => [collection.id, { ...collection }])
  )
  const bookmarks = new Map(
    remote.bookmarks.map((bookmark) => [bookmark.id, { ...bookmark }])
  )
  const unsortedId =
    remote.collections.find((collection) => collection.kind === "UNSORTED")
      ?.id ?? null

  const nodes = new Map(nodeList.map((node) => [node.id, node]))
  const links = new Map(
    stored.map((link) => [keyOf(link.kind, link.loomarkId), link])
  )
  const byNode = new Map(stored.map((link) => [link.nodeId, link]))
  const childrenOf = new Map<string, NativeNode[]>()

  const track = (node: NativeNode) => {
    const siblings = childrenOf.get(node.parentId) ?? []
    siblings.push(node)
    childrenOf.set(node.parentId, siblings)
  }

  for (const node of nodeList) {
    track(node)
  }

  let budget = MAX_REMOTE_WRITES

  const spend = () => {
    if (budget <= 0) {
      return false
    }

    budget -= 1

    return true
  }

  const drop = (link: SyncLink) => {
    links.delete(keyOf(link.kind, link.loomarkId))
    byNode.delete(link.nodeId)
  }

  const remember = (link: SyncLink) => {
    links.set(keyOf(link.kind, link.loomarkId), link)
    byNode.set(link.nodeId, link)
  }

  const folderFor = (parentLoomarkId: string | null) =>
    parentLoomarkId === null
      ? rootId
      : (links.get(keyOf("collection", parentLoomarkId))?.nodeId ?? null)

  const collectionFor = (parentNodeId: string) => {
    if (parentNodeId === rootId) {
      return null
    }

    const link = byNode.get(parentNodeId)

    return link?.kind === "collection" ? link.loomarkId : undefined
  }

  const isUnsorted = (id: string | null) =>
    id !== null && collections.get(id)?.kind === "UNSORTED"

  const depthOf = (collection: SyncCollection) => {
    const seen = new Set<string>()
    let current = collection.parentId
    let depth = 0

    while (current && !seen.has(current)) {
      seen.add(current)
      depth += 1
      current = collections.get(current)?.parentId ?? null
    }

    return depth
  }

  const pass = async () => {
    const nativeDoomed = new Set<string>()
    const doomedCollections = new Set<string>()
    const doomedBookmarks = new Set<string>()

    for (const link of stored) {
      const aliveRemote =
        link.kind === "collection"
          ? collections.has(link.loomarkId)
          : bookmarks.has(link.loomarkId)
      const aliveLocal = nodes.has(link.nodeId)

      if (aliveRemote && aliveLocal) {
        continue
      }

      if (!aliveRemote && aliveLocal) {
        nativeDoomed.add(link.nodeId)
        continue
      }

      if (aliveRemote && !aliveLocal) {
        if (link.kind === "bookmark") {
          doomedBookmarks.add(link.loomarkId)
        } else if (!isUnsorted(link.loomarkId)) {
          doomedCollections.add(link.loomarkId)
        } else {
          drop(link)
        }

        continue
      }

      drop(link)
    }

    const shadowed = new Set(nativeDoomed)

    for (const node of nodeList) {
      if (shadowed.has(node.parentId)) {
        shadowed.add(node.id)
      }
    }

    const purged = new Set<string>()

    for (const id of nativeDoomed) {
      const node = nodes.get(id)

      if (!node || shadowed.has(node.parentId)) {
        continue
      }

      try {
        await (node.url === null ? removeFolder(id) : removeLink(id))
        purged.add(id)
      } catch {
        continue
      }
    }

    for (const node of nodeList) {
      if (purged.has(node.parentId)) {
        purged.add(node.id)
      }
    }

    for (const id of purged) {
      const link = byNode.get(id)

      if (link) {
        drop(link)
      }

      nodes.delete(id)
    }

    const doomedAncestor = (parentId: string | null) => {
      const seen = new Set<string>()
      let current = parentId

      while (current && !seen.has(current)) {
        seen.add(current)

        if (doomedCollections.has(current)) {
          return true
        }

        current = collections.get(current)?.parentId ?? null
      }

      return false
    }

    const removedCollections = new Set<string>()

    for (const id of doomedCollections) {
      const collection = collections.get(id)

      if (!collection || doomedAncestor(collection.parentId)) {
        continue
      }

      if (!spend()) {
        break
      }

      try {
        await deleteRemoteCollection(auth, id)
        removedCollections.add(id)
      } catch (cause) {
        rethrowFatal(cause)
      }
    }

    const cascaded = (id: string) => {
      const seen = new Set<string>()
      let current: string | null = id

      while (current && !seen.has(current)) {
        seen.add(current)

        if (removedCollections.has(current)) {
          return true
        }

        current = collections.get(current)?.parentId ?? null
      }

      return false
    }

    const gone = new Set(
      remote.collections
        .filter((collection) => cascaded(collection.id))
        .map((collection) => collection.id)
    )

    for (const id of gone) {
      collections.delete(id)

      const link = links.get(keyOf("collection", id))

      if (link) {
        drop(link)
      }
    }

    for (const bookmark of remote.bookmarks) {
      if (!gone.has(bookmark.collectionId)) {
        continue
      }

      bookmarks.delete(bookmark.id)

      const link = links.get(keyOf("bookmark", bookmark.id))

      if (link) {
        drop(link)
      }
    }

    for (const id of doomedBookmarks) {
      if (!bookmarks.has(id)) {
        continue
      }

      if (!spend()) {
        break
      }

      try {
        await deleteRemoteBookmark(auth, id)
        bookmarks.delete(id)

        const link = links.get(keyOf("bookmark", id))

        if (link) {
          drop(link)
        }
      } catch (cause) {
        rethrowFatal(cause)
      }
    }

    const unclaimed = (parentNodeId: string) =>
      (childrenOf.get(parentNodeId) ?? []).filter(
        (node) => nodes.has(node.id) && !byNode.has(node.id)
      )

    const pendingCollections = [...collections.values()]
      .filter((collection) => !links.has(keyOf("collection", collection.id)))
      .sort((a, b) => depthOf(a) - depthOf(b))

    for (const collection of pendingCollections) {
      const parentNodeId = folderFor(collection.parentId)

      if (!parentNodeId) {
        continue
      }

      const adopted =
        unclaimed(parentNodeId).find(
          (node) =>
            node.url === null &&
            node.title.trim().toLowerCase() ===
              collection.name.trim().toLowerCase()
        ) ?? null

      let nodeId = adopted?.id ?? null

      if (adopted && adopted.title !== collection.name) {
        try {
          await renameNode(adopted.id, collection.name)
          adopted.title = collection.name
        } catch {
          continue
        }
      }

      if (!nodeId) {
        try {
          nodeId = await createFolder(parentNodeId, collection.name)
        } catch {
          continue
        }

        const created: NativeNode = {
          id: nodeId,
          parentId: parentNodeId,
          title: collection.name,
          url: null,
          index: childrenOf.get(parentNodeId)?.length ?? 0,
        }

        nodes.set(nodeId, created)
        track(created)
      }

      remember({
        kind: "collection",
        loomarkId: collection.id,
        nodeId,
        title: collection.name,
        url: null,
        parentLoomarkId: collection.parentId,
        index: nodes.get(nodeId)?.index ?? 0,
      })
    }

    for (const node of nodeList) {
      if (node.url !== null || !nodes.has(node.id) || byNode.has(node.id)) {
        continue
      }

      const parent = collectionFor(node.parentId)

      if (parent === undefined) {
        continue
      }

      const nested = isUnsorted(parent)
      const parentId = nested ? null : parent

      if (!spend()) {
        break
      }

      try {
        const created = await createRemoteCollection(auth, {
          name: clamp(node.title, MAX_NAME) || "Folder",
          icon: null,
          parentId,
        })

        collections.set(created.id, {
          id: created.id,
          name: created.name,
          parentId: created.parentId,
          kind: created.kind,
          position: created.position,
        })

        if (nested) {
          await moveNode(node.id, rootId).catch(() => null)
          node.parentId = rootId
        }

        if (created.name !== node.title) {
          await renameNode(node.id, created.name).catch(() => null)
          node.title = created.name
        }

        remember({
          kind: "collection",
          loomarkId: created.id,
          nodeId: node.id,
          title: created.name,
          url: null,
          parentLoomarkId: created.parentId,
          index: node.index,
        })
      } catch (cause) {
        rethrowFatal(cause)
      }
    }

    for (const bookmark of bookmarks.values()) {
      if (links.has(keyOf("bookmark", bookmark.id))) {
        continue
      }

      const parentNodeId = links.get(
        keyOf("collection", bookmark.collectionId)
      )?.nodeId

      if (!parentNodeId) {
        continue
      }

      const matches = unclaimed(parentNodeId).filter(
        (node) => node.url !== null && sameUrl(node.url, bookmark.url)
      )
      const adopted =
        matches.find((node) => node.title === bookmark.title) ??
        matches[0] ??
        null

      let nodeId = adopted?.id ?? null

      if (adopted && adopted.title !== bookmark.title) {
        await renameNode(adopted.id, bookmark.title).catch(() => null)
        adopted.title = bookmark.title
      }

      if (!nodeId) {
        try {
          nodeId = await createLink(parentNodeId, bookmark.title, bookmark.url)
        } catch {
          continue
        }

        const created: NativeNode = {
          id: nodeId,
          parentId: parentNodeId,
          title: bookmark.title,
          url: bookmark.url,
          index: childrenOf.get(parentNodeId)?.length ?? 0,
        }

        nodes.set(nodeId, created)
        track(created)
      }

      remember({
        kind: "bookmark",
        loomarkId: bookmark.id,
        nodeId,
        title: bookmark.title,
        url: bookmark.url,
        parentLoomarkId: bookmark.collectionId,
        index: nodes.get(nodeId)?.index ?? 0,
      })
    }

    for (const node of nodeList) {
      if (node.url === null || !nodes.has(node.id) || byNode.has(node.id)) {
        continue
      }

      const parent = collectionFor(node.parentId)

      if (parent === undefined) {
        continue
      }

      const collectionId = parent ?? unsortedId

      if (!spend()) {
        break
      }

      try {
        const created = await createRemoteBookmark(auth, {
          url: node.url,
          title: clamp(node.title, MAX_TITLE) || node.url,
          collectionId,
          pinned: false,
        })

        bookmarks.set(created.id, {
          id: created.id,
          url: created.url,
          title: created.title,
          collectionId: created.collectionId,
          position: created.position,
        })

        if (created.title !== node.title) {
          await renameNode(node.id, created.title).catch(() => null)
          node.title = created.title
        }

        if (created.url !== node.url) {
          await retargetLink(node.id, created.url).catch(() => null)
          node.url = created.url
        }

        remember({
          kind: "bookmark",
          loomarkId: created.id,
          nodeId: node.id,
          title: created.title,
          url: created.url,
          parentLoomarkId: created.collectionId,
          index: node.index,
        })
      } catch (cause) {
        rethrowFatal(cause)
      }
    }

    const mergeCollection = async (
      link: SyncLink,
      node: NativeNode,
      collection: SyncCollection
    ) => {
      const locked = collection.kind === "UNSORTED"
      const localParent = collectionFor(node.parentId)
      const name = clamp(node.title, MAX_NAME)

      const pushName =
        !locked &&
        Boolean(name) &&
        collection.name === link.title &&
        name !== link.title
      const pushParent =
        !locked &&
        collection.parentId === link.parentLoomarkId &&
        localParent !== undefined &&
        localParent !== link.parentLoomarkId

      if (pushName || pushParent) {
        if (!spend()) {
          return
        }

        const parentId = isUnsorted(localParent ?? null)
          ? null
          : (localParent ?? null)

        try {
          const updated = await updateRemoteCollection(auth, collection.id, {
            ...(pushName ? { name } : {}),
            ...(pushParent ? { parentId } : {}),
          })

          collection.name = updated.name
          collection.parentId = updated.parentId
        } catch (cause) {
          rethrowFatal(cause)
          return
        }
      }

      if (node.title !== collection.name) {
        try {
          await renameNode(node.id, collection.name)
          node.title = collection.name
        } catch {
          return
        }
      }

      const target = folderFor(collection.parentId)

      if (target && target !== node.id && node.parentId !== target) {
        try {
          await moveNode(node.id, target)
          node.parentId = target
        } catch {
          return
        }
      }

      remember({
        ...link,
        title: collection.name,
        parentLoomarkId: collection.parentId,
      })
    }

    const mergeBookmark = async (
      link: SyncLink,
      node: NativeNode,
      bookmark: SyncBookmark
    ) => {
      const localParent = collectionFor(node.parentId)
      const localCollectionId =
        localParent === undefined ? undefined : (localParent ?? unsortedId)
      const nodeUrl = node.url ?? bookmark.url
      const baseUrl = link.url ?? bookmark.url
      const title = clamp(node.title, MAX_TITLE)

      const patch: {
        title?: string
        url?: string
        collectionId?: string | null
      } = {}

      if (
        Boolean(title) &&
        bookmark.title === link.title &&
        title !== link.title
      ) {
        patch.title = title
      }

      if (sameUrl(bookmark.url, baseUrl) && !sameUrl(nodeUrl, baseUrl)) {
        patch.url = nodeUrl
      }

      if (
        bookmark.collectionId === link.parentLoomarkId &&
        localCollectionId !== undefined &&
        localCollectionId !== link.parentLoomarkId
      ) {
        patch.collectionId = localCollectionId
      }

      if (Object.keys(patch).length > 0) {
        if (!spend()) {
          return
        }

        try {
          const updated = await updateRemoteBookmark(auth, bookmark.id, patch)

          bookmark.title = updated.title
          bookmark.url = updated.url
          bookmark.collectionId = updated.collectionId
        } catch (cause) {
          rethrowFatal(cause)
          return
        }
      }

      if (node.title !== bookmark.title) {
        try {
          await renameNode(node.id, bookmark.title)
          node.title = bookmark.title
        } catch {
          return
        }
      }

      if (node.url !== null && !sameUrl(node.url, bookmark.url)) {
        try {
          await retargetLink(node.id, bookmark.url)
          node.url = bookmark.url
        } catch {
          return
        }
      }

      const target = links.get(
        keyOf("collection", bookmark.collectionId)
      )?.nodeId

      if (target && node.parentId !== target) {
        try {
          await moveNode(node.id, target)
          node.parentId = target
        } catch {
          return
        }
      }

      remember({
        ...link,
        title: bookmark.title,
        url: bookmark.url,
        parentLoomarkId: bookmark.collectionId,
      })
    }

    for (const link of [...links.values()]) {
      const node = nodes.get(link.nodeId)

      if (!node) {
        continue
      }

      if (link.kind === "collection") {
        const collection = collections.get(link.loomarkId)

        if (collection) {
          await mergeCollection(link, node, collection)
        }

        continue
      }

      const bookmark = bookmarks.get(link.loomarkId)

      if (bookmark) {
        await mergeBookmark(link, node, bookmark)
      }
    }

    const moved = await readSubtree(rootId)

    if (moved) {
      for (const fresh of moved) {
        const node = nodes.get(fresh.id)

        if (node) {
          node.index = fresh.index
          node.parentId = fresh.parentId
        }
      }
    }

    const folders = new Map<string, SyncLink[]>()

    for (const link of links.values()) {
      const node = nodes.get(link.nodeId)

      if (!node) {
        continue
      }

      const siblings = folders.get(node.parentId) ?? []

      siblings.push(link)
      folders.set(node.parentId, siblings)
    }

    const rankOf = (link: SyncLink) => {
      if (link.kind === "bookmark") {
        return bookmarks.get(link.loomarkId)?.position ?? UNRANKED
      }

      const collection = collections.get(link.loomarkId)

      if (!collection) {
        return UNRANKED
      }

      return collection.kind === "UNSORTED" ? PINNED : collection.position
    }

    const byRank = (a: SyncLink, b: SyncLink) =>
      rankOf(a) - rankOf(b) ||
      compareText(a.title, b.title) ||
      compareText(a.loomarkId, b.loomarkId)

    const groups: SyncOrderGroup[] = []

    for (const [parentNodeId, members] of folders) {
      if (members.length < 2) {
        continue
      }

      const mapped =
        parentNodeId === rootId
          ? null
          : (byNode.get(parentNodeId)?.loomarkId ?? null)
      const container = isUnsorted(mapped) ? null : mapped

      let restack = false
      let pushed = false

      const settle = (typed: SyncLink[], type: SyncOrderGroup["type"]) => {
        if (typed.length < 2) {
          return
        }

        const local = sequence(
          [...typed].sort(
            (a, b) =>
              (nodes.get(a.nodeId)?.index ?? 0) -
              (nodes.get(b.nodeId)?.index ?? 0)
          )
        )
        const base = sequence([...typed].sort((a, b) => a.index - b.index))
        const remote = sequence([...typed].sort(byRank))

        if (same(local, base)) {
          restack = restack || !same(remote, local)
          return
        }

        if (!same(remote, base)) {
          restack = true
          return
        }

        groups.push({ collectionId: container, type, ids: local })
        pushed = true
      }

      if (container === null) {
        for (const kind of KINDS) {
          settle(
            members.filter((link) => link.kind === kind),
            kind
          )
        }
      } else {
        settle(members, "all")
      }

      if (!restack || pushed) {
        continue
      }

      for (const link of [...members].sort(byRank)) {
        await moveNode(link.nodeId, parentNodeId).catch(() => null)
      }
    }

    if (groups.length > 0 && spend()) {
      try {
        await pushSyncOrder(auth, groups)
      } catch (cause) {
        rethrowFatal(cause)
      }
    }

    const settled = await readSubtree(rootId)

    if (settled) {
      const indices = new Map(settled.map((node) => [node.id, node.index]))

      for (const link of [...links.values()]) {
        const next = indices.get(link.nodeId)

        if (next !== undefined && next !== link.index) {
          remember({ ...link, index: next })
        }
      }
    }
  }

  let failure: unknown = null

  try {
    await pass()
  } catch (cause) {
    failure = cause
  }

  return { links: [...links.values()], failure }
}

let running = false

export const runSync = async (): Promise<SyncStatus> => {
  const settings = await readSyncSettings()

  if (!settings.enabled) {
    return readSyncStatus()
  }

  if (running) {
    return readSyncStatus()
  }

  running = true

  const previous = await readSyncStatus()

  await writeSyncStatus({ ...previous, running: true, startedAt: Date.now() })

  const finish = async (error: string | null) => {
    const status: SyncStatus = {
      at: error ? previous.at : Date.now(),
      running: false,
      startedAt: null,
      error,
    }

    await writeSyncStatus(status)
    running = false

    return status
  }

  try {
    if (!(await hasBookmarksPermission())) {
      return await finish("Loomark needs permission to read your bookmarks")
    }

    const connection = await readConnection()

    if (!connection) {
      return await finish("Connect Loomark to sync")
    }

    const auth: Auth = {
      serverUrl: connection.serverUrl,
      token: connection.token,
    }

    const rootId = settings.rootId ?? (await defaultRootId())

    if (!rootId) {
      return await finish("Could not find a bookmarks folder to sync")
    }

    if (rootId !== settings.rootId) {
      await writeSyncSettings({ ...settings, rootId })
    }

    const nodeList = await readSubtree(rootId)

    if (!nodeList) {
      return await finish("The sync folder is gone. Pick another one.")
    }

    const remote = await fetchSyncSnapshot(auth)
    const stored = await readSyncLinks()

    const { links, failure } = await reconcile(
      auth,
      rootId,
      remote,
      nodeList,
      stored
    )

    await writeSyncLinks(links)

    if (failure) {
      throw failure
    }

    return await finish(null)
  } catch (cause) {
    if (isUnauthorized(cause)) {
      return await finish("Your Loomark session expired. Reconnect to sync.")
    }

    return await finish(cause instanceof Error ? cause.message : "Sync failed")
  }
}
