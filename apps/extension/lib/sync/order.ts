import { compareSiblings } from "@loomark/core/order"
import type { SyncOrderGroup } from "@loomark/core/types"

import { pushSyncOrder } from "@/lib/api"
import { moveNode, readSubtree } from "@/lib/bookmarks"
import type { SyncLink } from "@/lib/storage"
import type { SyncContext } from "@/lib/sync/context"
import { rethrowFatal, UNRANKED } from "@/lib/sync/utils"

const sequence = (links: SyncLink[]) => links.map((link) => link.loomarkId)

const same = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index])

const refreshNodes = async ({ rootId, nodes }: SyncContext) => {
  const fresh = await readSubtree(rootId)

  for (const next of fresh ?? []) {
    const node = nodes.get(next.id)

    if (node) {
      node.index = next.index
      node.parentId = next.parentId
    }
  }
}

const recordIndices = async ({ rootId, links, remember }: SyncContext) => {
  const settled = await readSubtree(rootId)

  if (!settled) {
    return
  }

  const indices = new Map(settled.map((node) => [node.id, node.index]))

  for (const link of [...links.values()]) {
    const next = indices.get(link.nodeId)

    if (next !== undefined && next !== link.index) {
      remember({ ...link, index: next })
    }
  }
}

export const syncOrder = async (context: SyncContext) => {
  const {
    auth,
    rootId,
    collections,
    bookmarks,
    nodes,
    links,
    byNode,
    pushed,
    spend,
  } = context

  await refreshNodes(context)

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

  const rankOf = (link: SyncLink) =>
    (link.kind === "bookmark"
      ? bookmarks.get(link.loomarkId)?.position
      : collections.get(link.loomarkId)?.position) ?? UNRANKED

  const byRank = (a: SyncLink, b: SyncLink) =>
    compareSiblings(
      { type: a.kind, id: a.loomarkId, title: a.title, position: rankOf(a) },
      { type: b.kind, id: b.loomarkId, title: b.title, position: rankOf(b) }
    )

  const byIndex = (a: SyncLink, b: SyncLink) =>
    (nodes.get(a.nodeId)?.index ?? 0) - (nodes.get(b.nodeId)?.index ?? 0)

  const groups: SyncOrderGroup[] = []

  for (const [parentNodeId, members] of folders) {
    if (members.length < 2) {
      continue
    }

    const container =
      parentNodeId === rootId
        ? null
        : (byNode.get(parentNodeId)?.loomarkId ?? null)

    const local = [...members].sort(byIndex)
    const known = local.filter((link) => !pushed.has(link.nodeId))
    const base = sequence([...known].sort((a, b) => a.index - b.index))
    const remote = [...known].sort(byRank)
    const keepLocal =
      !same(sequence(known), base) && same(sequence(remote), base)

    let next = 0

    const order = keepLocal
      ? local
      : local.map((link) =>
          pushed.has(link.nodeId) ? link : (remote[next++] ?? link)
        )

    if (keepLocal || known.length < local.length) {
      groups.push({
        collectionId: container,
        type: "all",
        ids: sequence(order),
      })
    }

    if (same(sequence(order), sequence(local))) {
      continue
    }

    for (const link of order) {
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

  await recordIndices(context)
}
