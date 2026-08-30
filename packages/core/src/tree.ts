import type { CollectionDTO, CollectionNode } from "./types"
import type { FlatCollection } from "./types"

export type { FlatCollection }

type TreeShape = { id: string; parentId: string | null }

const compareSiblings = (a: CollectionDTO, b: CollectionDTO) =>
  a.position - b.position || a.name.localeCompare(b.name)

export const buildCollectionTree = (collections: CollectionDTO[]): CollectionNode[] => {
  const nodes = new Map<string, CollectionNode>()

  for (const collection of collections) {
    nodes.set(collection.id, {
      ...collection,
      children: [],
      totalCount: collection.bookmarkCount,
    })
  }

  const roots: CollectionNode[] = []

  for (const collection of collections) {
    const node = nodes.get(collection.id)

    if (!node) {
      continue
    }

    const parent = collection.parentId ? nodes.get(collection.parentId) : null

    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortLevel = (level: CollectionNode[]) => {
    level.sort(
      (a, b) =>
        Number(b.kind === "UNSORTED") - Number(a.kind === "UNSORTED") ||
        compareSiblings(a, b)
    )

    for (const node of level) {
      sortLevel(node.children)
      node.totalCount += node.children.reduce((sum, child) => sum + child.totalCount, 0)
    }
  }

  sortLevel(roots)

  return roots
}

export const flattenCollections = (collections: CollectionDTO[]): FlatCollection[] => {
  const byParent = new Map<string | null, CollectionDTO[]>()

  for (const collection of collections) {
    const siblings = byParent.get(collection.parentId) ?? []
    siblings.push(collection)
    byParent.set(collection.parentId, siblings)
  }

  for (const siblings of byParent.values()) {
    siblings.sort(
      (a, b) =>
        Number(b.kind === "UNSORTED") - Number(a.kind === "UNSORTED") ||
        compareSiblings(a, b)
    )
  }

  const walk = (parentId: string | null, depth: number): FlatCollection[] =>
    (byParent.get(parentId) ?? []).flatMap((collection) => {
      const node: CollectionNode = {
        ...collection,
        children: [],
        totalCount: collection.bookmarkCount,
      }
      return [{ ...node, depth }, ...walk(collection.id, depth + 1)]
    })

  return walk(null, 0)
}

export const collectDescendantIds = (
  collections: TreeShape[],
  rootId: string
): string[] => {
  const childrenByParent = new Map<string, string[]>()

  for (const collection of collections) {
    if (!collection.parentId) {
      continue
    }

    const siblings = childrenByParent.get(collection.parentId) ?? []
    siblings.push(collection.id)
    childrenByParent.set(collection.parentId, siblings)
  }

  const ids: string[] = []
  const queue = [rootId]

  while (queue.length > 0) {
    const current = queue.shift()

    if (!current) {
      break
    }

    ids.push(current)
    queue.push(...(childrenByParent.get(current) ?? []))
  }

  return ids
}

export const parentsFirst = <T extends { id: string; parentId?: string | null }>(
  collections: T[]
): T[] => {
  const byId = new Map(collections.map((collection) => [collection.id, collection]))

  const depthOf = (collection: T, seen = new Set<string>()): number => {
    const parent = collection.parentId ? byId.get(collection.parentId) : null

    if (!parent || seen.has(collection.id)) {
      return 0
    }

    seen.add(collection.id)

    return depthOf(parent, seen) + 1
  }

  return [...collections].sort((a, b) => depthOf(a) - depthOf(b))
}

export const flattenTree = (nodes: CollectionNode[], depth = 0): FlatCollection[] =>
  nodes.flatMap((node) => [{ ...node, depth }, ...flattenTree(node.children, depth + 1)])

export const siblingsOf = (collections: CollectionDTO[], parentId: string | null) =>
  collections
    .filter((collection) => collection.kind === "USER" && collection.parentId === parentId)
    .sort(compareSiblings)

export const applyCollectionMove = (
  collections: CollectionDTO[],
  id: string,
  parentId: string | null,
  index: number
): CollectionDTO[] => {
  const moved = collections.find((collection) => collection.id === id)

  if (!moved) {
    return collections
  }

  const siblings = siblingsOf(collections, parentId).filter(
    (collection) => collection.id !== id
  )
  const target = Math.min(Math.max(index, 0), siblings.length)
  const ordered = [...siblings.slice(0, target), moved, ...siblings.slice(target)]
  const positions = new Map(ordered.map((collection, i) => [collection.id, i]))

  return collections.map((collection) => {
    const position = positions.get(collection.id)

    if (position === undefined) {
      return collection
    }

    return collection.id === id
      ? { ...collection, parentId, position }
      : { ...collection, position }
  })
}

export const insertionIndex = (
  collections: CollectionDTO[],
  parentId: string | null,
  beforeId: string | null,
  excludeId: string
) => {
  const siblings = siblingsOf(collections, parentId).filter(
    (collection) => collection.id !== excludeId
  )

  if (!beforeId) {
    return siblings.length
  }

  const index = siblings.findIndex((collection) => collection.id === beforeId)

  return index === -1 ? siblings.length : index
}

export const changedCollections = (before: CollectionDTO[], after: CollectionDTO[]) =>
  after.filter(
    (collection, index) =>
      collection.parentId !== before[index]?.parentId ||
      collection.position !== before[index]?.position
  )

export const unsortedCollection = (collections: CollectionDTO[]) =>
  collections.find((collection) => collection.kind === "UNSORTED") ?? null
