export const DRAG_TYPE = {
  collection: "collection",
  bookmark: "bookmark",
} as const

export const DROP_PRIORITY = {
  edge: 4,
  row: 2,
} as const

export type DropZone = "before" | "into" | "root"

export type DropTargetData = {
  zone: DropZone
  collectionId?: string
  parentId?: string | null
}

export const dropTargetData = (data: unknown) =>
  (data ?? null) as DropTargetData | null
