import type { SyncSnapshot } from "@loomark/core/types"

import type { Auth } from "@/lib/api"
import type { NativeNode } from "@/lib/bookmarks"
import type { SyncLink } from "@/lib/storage"
import { keyOf, MAX_REMOTE_WRITES } from "@/lib/sync/utils"

type SyncInput = {
  auth: Auth
  rootId: string
  remote: SyncSnapshot
  nodeList: NativeNode[]
  stored: SyncLink[]
}

export const createContext = ({
  auth,
  rootId,
  remote,
  nodeList,
  stored,
}: SyncInput) => {
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
  const pushed = new Set<string>()

  const track = (node: NativeNode) => {
    const siblings = childrenOf.get(node.parentId) ?? []
    siblings.push(node)
    childrenOf.set(node.parentId, siblings)
  }

  const relocate = (node: NativeNode, parentId: string) => {
    childrenOf.set(
      node.parentId,
      (childrenOf.get(node.parentId) ?? []).filter(
        (sibling) => sibling.id !== node.id
      )
    )

    node.parentId = parentId
    track(node)
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

  const isUnsorted = (id: string | null) =>
    id !== null && collections.get(id)?.kind === "UNSORTED"

  const folderFor = (parentLoomarkId: string | null) =>
    parentLoomarkId === null || isUnsorted(parentLoomarkId)
      ? rootId
      : (links.get(keyOf("collection", parentLoomarkId))?.nodeId ?? null)

  const collectionFor = (parentNodeId: string) => {
    if (parentNodeId === rootId) {
      return null
    }

    const link = byNode.get(parentNodeId)

    return link?.kind === "collection" ? link.loomarkId : undefined
  }

  const unclaimed = (parentNodeId: string) =>
    (childrenOf.get(parentNodeId) ?? []).filter(
      (node) => nodes.has(node.id) && !byNode.has(node.id)
    )

  return {
    auth,
    rootId,
    remote,
    nodeList,
    stored,
    collections,
    bookmarks,
    unsortedId,
    nodes,
    links,
    byNode,
    childrenOf,
    pushed,
    track,
    relocate,
    spend,
    drop,
    remember,
    isUnsorted,
    folderFor,
    collectionFor,
    unclaimed,
  }
}

export type SyncContext = ReturnType<typeof createContext>
