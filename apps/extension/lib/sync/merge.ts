import type { SyncBookmark, SyncCollection } from "@loomark/core/types"

import {
  updateBookmark as updateRemoteBookmark,
  updateCollection as updateRemoteCollection,
} from "@/lib/api"
import {
  moveNode,
  renameNode,
  retargetLink,
  type NativeNode,
} from "@/lib/bookmarks"
import type { SyncLink } from "@/lib/storage"
import type { SyncContext } from "@/lib/sync/context"
import {
  clamp,
  MAX_NAME,
  MAX_TITLE,
  rethrowFatal,
  sameUrl,
  UNRANKED,
} from "@/lib/sync/utils"

const mergeCollection = async (
  {
    auth,
    pushed,
    spend,
    remember,
    relocate,
    isUnsorted,
    folderFor,
    collectionFor,
  }: SyncContext,
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

      if (pushParent) {
        pushed.add(node.id)
      }
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
  let index = link.index

  if (target && target !== node.id && node.parentId !== target) {
    try {
      await moveNode(node.id, target)
      relocate(node, target)
      index = UNRANKED
    } catch {
      return
    }
  }

  remember({
    ...link,
    title: collection.name,
    parentLoomarkId: collection.parentId,
    index,
  })
}

const mergeBookmark = async (
  {
    auth,
    unsortedId,
    pushed,
    spend,
    remember,
    relocate,
    folderFor,
    collectionFor,
  }: SyncContext,
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

  if (Boolean(title) && bookmark.title === link.title && title !== link.title) {
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

      if (patch.collectionId !== undefined) {
        pushed.add(node.id)
      }
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

  const target = folderFor(bookmark.collectionId)
  let index = link.index

  if (target && node.parentId !== target) {
    try {
      await moveNode(node.id, target)
      relocate(node, target)
      index = UNRANKED
    } catch {
      return
    }
  }

  remember({
    ...link,
    title: bookmark.title,
    url: bookmark.url,
    parentLoomarkId: bookmark.collectionId,
    index,
  })
}

export const mergeLinks = async (context: SyncContext) => {
  const { links, nodes, collections, bookmarks } = context

  for (const link of [...links.values()]) {
    const node = nodes.get(link.nodeId)

    if (!node) {
      continue
    }

    if (link.kind === "collection") {
      const collection = collections.get(link.loomarkId)

      if (collection) {
        await mergeCollection(context, link, node, collection)
      }

      continue
    }

    const bookmark = bookmarks.get(link.loomarkId)

    if (bookmark) {
      await mergeBookmark(context, link, node, bookmark)
    }
  }
}
