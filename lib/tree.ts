import type { CollectionDTO, CollectionNode } from "@/lib/types"

type TreeShape = { id: string; parentId: string | null }

export const buildCollectionTree = (
  collections: CollectionDTO[]
): CollectionNode[] => {
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
        a.name.localeCompare(b.name)
    )

    for (const node of level) {
      sortLevel(node.children)
      node.totalCount += node.children.reduce(
        (sum, child) => sum + child.totalCount,
        0
      )
    }
  }

  sortLevel(roots)

  return roots
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

export type FlatCollection = CollectionNode & { depth: number }

export const flattenTree = (
  nodes: CollectionNode[],
  depth = 0
): FlatCollection[] =>
  nodes.flatMap((node) => [
    { ...node, depth },
    ...flattenTree(node.children, depth + 1),
  ])
