import {
  deleteBookmark as deleteRemoteBookmark,
  deleteCollection as deleteRemoteCollection,
} from "@/lib/api"
import { removeFolder, removeLink } from "@/lib/bookmarks"
import type { SyncContext } from "@/lib/sync/context"
import { keyOf, rethrowFatal } from "@/lib/sync/utils"

const classify = ({
  stored,
  collections,
  bookmarks,
  nodes,
  isUnsorted,
  drop,
}: SyncContext) => {
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

  return { nativeDoomed, doomedCollections, doomedBookmarks }
}

const removeNativeNodes = async (
  { nodeList, nodes, byNode, drop }: SyncContext,
  doomed: Set<string>
) => {
  const shadowed = new Set(doomed)

  for (const node of nodeList) {
    if (shadowed.has(node.parentId)) {
      shadowed.add(node.id)
    }
  }

  const purged = new Set<string>()

  for (const id of doomed) {
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
}

const removeRemoteCollections = async (
  { auth, remote, collections, bookmarks, links, spend, drop }: SyncContext,
  doomed: Set<string>
) => {
  const doomedAncestor = (parentId: string | null) => {
    const seen = new Set<string>()
    let current = parentId

    while (current && !seen.has(current)) {
      seen.add(current)

      if (doomed.has(current)) {
        return true
      }

      current = collections.get(current)?.parentId ?? null
    }

    return false
  }

  const removed = new Set<string>()

  for (const id of doomed) {
    const collection = collections.get(id)

    if (!collection || doomedAncestor(collection.parentId)) {
      continue
    }

    if (!spend()) {
      break
    }

    try {
      await deleteRemoteCollection(auth, id)
      removed.add(id)
    } catch (cause) {
      rethrowFatal(cause)
    }
  }

  const cascaded = (id: string) => {
    const seen = new Set<string>()
    let current: string | null = id

    while (current && !seen.has(current)) {
      seen.add(current)

      if (removed.has(current)) {
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
}

const removeRemoteBookmarks = async (
  { auth, bookmarks, links, spend, drop }: SyncContext,
  doomed: Set<string>
) => {
  for (const id of doomed) {
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
}

export const propagateDeletions = async (context: SyncContext) => {
  const { nativeDoomed, doomedCollections, doomedBookmarks } = classify(context)

  await removeNativeNodes(context, nativeDoomed)
  await removeRemoteCollections(context, doomedCollections)
  await removeRemoteBookmarks(context, doomedBookmarks)
}
