import {
  createBookmark as createRemoteBookmark,
  createCollection as createRemoteCollection,
} from "@/lib/api"
import { renameNode, retargetLink } from "@/lib/bookmarks"
import type { SyncContext } from "@/lib/sync/context"
import { clamp, MAX_NAME, MAX_TITLE, rethrowFatal } from "@/lib/sync/utils"

export const pushFolders = async ({
  auth,
  nodeList,
  nodes,
  byNode,
  collections,
  pushed,
  spend,
  remember,
  collectionFor,
}: SyncContext) => {
  for (const node of nodeList) {
    if (node.url !== null || !nodes.has(node.id) || byNode.has(node.id)) {
      continue
    }

    const parent = collectionFor(node.parentId)

    if (parent === undefined) {
      continue
    }

    if (!spend()) {
      break
    }

    try {
      const created = await createRemoteCollection(auth, {
        name: clamp(node.title, MAX_NAME) || "Folder",
        icon: null,
        parentId: parent,
      })

      collections.set(created.id, {
        id: created.id,
        name: created.name,
        parentId: created.parentId,
        kind: created.kind,
        position: created.position,
      })

      pushed.add(node.id)

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
}

export const pushLinks = async ({
  auth,
  nodeList,
  nodes,
  byNode,
  bookmarks,
  unsortedId,
  pushed,
  spend,
  remember,
  collectionFor,
}: SyncContext) => {
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

      pushed.add(node.id)

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
}
