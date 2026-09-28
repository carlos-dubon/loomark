import type { SyncCollection } from "@loomark/core/types"

import {
  createFolder,
  createLink,
  renameNode,
  type NativeNode,
} from "@/lib/bookmarks"
import type { SyncContext } from "@/lib/sync/context"
import { keyOf, sameUrl, UNRANKED } from "@/lib/sync/utils"

export const pullCollections = async ({
  collections,
  links,
  nodes,
  childrenOf,
  track,
  remember,
  isUnsorted,
  folderFor,
  unclaimed,
}: SyncContext) => {
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

  const pending = [...collections.values()]
    .filter(
      (collection) =>
        !isUnsorted(collection.id) &&
        !links.has(keyOf("collection", collection.id))
    )
    .sort((a, b) => depthOf(a) - depthOf(b))

  for (const collection of pending) {
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
      index: UNRANKED,
    })
  }
}

export const pullBookmarks = async ({
  bookmarks,
  links,
  nodes,
  childrenOf,
  track,
  remember,
  folderFor,
  unclaimed,
}: SyncContext) => {
  for (const bookmark of bookmarks.values()) {
    if (links.has(keyOf("bookmark", bookmark.id))) {
      continue
    }

    const parentNodeId = folderFor(bookmark.collectionId)

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
      index: UNRANKED,
    })
  }
}
