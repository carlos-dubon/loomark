export const DRAG_TYPE = {
  collection: "collection",
  collectionCard: "collection-card",
  bookmark: "bookmark",
} as const

export const COLLECTION_DROP_PRIORITY = 2

export const TREE_GROUP = "collection-tree"

export const TREE_INDENT = 16

const CARD_PREFIX = "card:"

export type CollectionDropData = {
  collectionId: string
}

export type CollectionDragData = {
  collectionId: string
}

export const collectionDropData = (data: unknown) =>
  (data ?? null) as CollectionDropData | null

export const collectionCardId = (collectionId: string) =>
  `${CARD_PREFIX}${collectionId}`

export const isCollectionCardId = (id: string | number) =>
  String(id).startsWith(CARD_PREFIX)

export const collectionSourceId = (
  source: { id: string | number; data?: unknown } | null | undefined
) => {
  if (!source) {
    return null
  }

  const data = (source.data ?? null) as CollectionDragData | null

  return data?.collectionId ?? String(source.id)
}
