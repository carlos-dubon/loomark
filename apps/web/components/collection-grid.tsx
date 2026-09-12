"use client"

import { pointerIntersection } from "@dnd-kit/collision"
import { useDroppable } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import { useCallback, useMemo } from "react"

import type { CollectionDTO } from "@loomark/core/types"
import { cn } from "@loomark/core/utils"

import { CollectionCard } from "@/components/collection-card"
import { useCoarsePointer } from "@/hooks/use-coarse-pointer"
import { useCollectionReorder } from "@/hooks/use-collection-reorder"
import {
  COLLECTION_DROP_PRIORITY,
  collectionCardId,
  DRAG_TYPE,
  type CollectionDragData,
  type CollectionDropData,
} from "@/lib/dnd"

const CollectionGridItem = ({
  collection,
  index,
  parentId,
}: {
  collection: CollectionDTO
  index: number
  parentId: string | null
}) => {
  const coarsePointer = useCoarsePointer()

  const dragData = useMemo<CollectionDragData>(
    () => ({ collectionId: collection.id }),
    [collection.id]
  )
  const dropData = useMemo<CollectionDropData>(
    () => ({ collectionId: collection.id }),
    [collection.id]
  )

  const { ref: sortableRef, isDragSource } = useSortable({
    id: collectionCardId(collection.id),
    index,
    group: parentId ?? "root",
    type: DRAG_TYPE.collectionCard,
    accept: DRAG_TYPE.collectionCard,
    data: dragData,
    disabled: { draggable: coarsePointer, droppable: false },
  })

  const { ref: dropRef, isDropTarget } = useDroppable({
    id: `card-bookmarks:${collection.id}`,
    accept: DRAG_TYPE.bookmark,
    collisionDetector: pointerIntersection,
    collisionPriority: COLLECTION_DROP_PRIORITY,
    data: dropData,
  })

  const setCardRef = useCallback(
    (element: HTMLDivElement | null) => {
      sortableRef(element)
      dropRef(element)
    },
    [sortableRef, dropRef]
  )

  return (
    <div
      ref={setCardRef}
      className={cn(
        "rounded-lg transition-opacity pointer-fine:touch-none",
        isDragSource && "opacity-40",
        isDropTarget &&
          "ring-2 ring-primary/70 ring-offset-1 ring-offset-background"
      )}
    >
      <CollectionCard
        href={`/collections/${collection.id}`}
        icon={collection.icon}
        name={collection.name}
        count={collection.bookmarkCount}
      />
    </div>
  )
}

export const CollectionGrid = ({
  collections,
  parentId,
}: {
  collections: CollectionDTO[]
  parentId: string | null
}) => {
  useCollectionReorder(parentId)

  return (
    <div className="grid gap-3 @lg:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4">
      {collections.map((collection, index) => (
        <CollectionGridItem
          key={collection.id}
          collection={collection}
          index={index}
          parentId={parentId}
        />
      ))}
    </div>
  )
}
