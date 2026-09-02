"use client"

import { pointerIntersection } from "@dnd-kit/collision"
import { useDragOperation, useDraggable, useDroppable } from "@dnd-kit/react"
import { useAtomValue } from "jotai"
import { CornerLeftUpIcon, LibraryIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useCallback, useMemo } from "react"

import { collectDescendantIds, type FlatCollection } from "@loomark/core/tree"
import { cn } from "@loomark/core/utils"
import { CollectionIcon } from "@loomark/ui/components/collection-icon"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@loomark/ui/components/sidebar"

import { Link } from "@/components/link"
import { useCollectionItems } from "@/hooks/use-collection-items"
import { DRAG_TYPE, DROP_PRIORITY, type DropTargetData } from "@/lib/dnd"
import { collectionsAtom } from "@/store/atoms"

const INDENT_WIDTH = 16

const DropEdge = ({
  id,
  data,
  disabled,
  className,
}: {
  id: string
  data: DropTargetData
  disabled: boolean
  className?: string
}) => {
  const { ref, isDropTarget } = useDroppable({
    id,
    accept: DRAG_TYPE.collection,
    collisionDetector: pointerIntersection,
    collisionPriority: DROP_PRIORITY.edge,
    data,
    disabled,
  })

  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none absolute right-0 left-0 z-10 h-3",
        className
      )}
    >
      {isDropTarget ? (
        <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary" />
      ) : null}
    </div>
  )
}

const CollectionRow = ({
  item,
  excluded,
}: {
  item: FlatCollection
  excluded: boolean
}) => {
  const pathname = usePathname()
  const href = `/collections/${item.id}`

  const beforeData = useMemo<DropTargetData>(
    () => ({ zone: "before", collectionId: item.id, parentId: item.parentId }),
    [item.id, item.parentId]
  )
  const intoData = useMemo<DropTargetData>(
    () => ({ zone: "into", collectionId: item.id }),
    [item.id]
  )

  const { ref: dragRef, isDragSource } = useDraggable({
    id: item.id,
    type: DRAG_TYPE.collection,
  })

  const { ref: dropRef, isDropTarget } = useDroppable({
    id: `into:${item.id}`,
    accept: [DRAG_TYPE.collection, DRAG_TYPE.bookmark],
    collisionDetector: pointerIntersection,
    collisionPriority: DROP_PRIORITY.row,
    data: intoData,
    disabled: excluded,
  })

  const setRowRef = useCallback(
    (element: HTMLDivElement | null) => {
      dragRef(element)
      dropRef(element)
    },
    [dragRef, dropRef]
  )

  return (
    <SidebarMenuItem>
      <div
        className="relative rounded-md"
        style={{ marginLeft: item.depth * INDENT_WIDTH }}
      >
        <DropEdge
          id={`before:${item.id}`}
          data={beforeData}
          disabled={excluded}
          className="-top-1.5"
        />
        <div
          ref={setRowRef}
          className={cn(
            "relative rounded-md transition-opacity",
            isDragSource && "opacity-40",
            isDropTarget &&
              "ring-2 ring-sidebar-primary/70 ring-offset-1 ring-offset-sidebar"
          )}
        >
          <SidebarMenuButton
            isActive={pathname === href}
            tooltip={item.name}
            className="w-full min-w-0 pr-8"
            render={<Link href={href} />}
          >
            <CollectionIcon name={item.icon} />
            <span className="truncate">{item.name}</span>
          </SidebarMenuButton>
          {item.totalCount > 0 ? (
            <span className="pointer-events-none absolute top-1/2 right-1 flex size-6 -translate-y-1/2 items-center justify-center text-xs text-muted-foreground tabular-nums">
              {item.totalCount}
            </span>
          ) : null}
        </div>
      </div>
    </SidebarMenuItem>
  )
}

const RootDropZone = () => {
  const { ref, isDropTarget } = useDroppable({
    id: "root",
    accept: DRAG_TYPE.collection,
    collisionDetector: pointerIntersection,
    collisionPriority: DROP_PRIORITY.edge,
    data: { zone: "root" } satisfies DropTargetData,
  })

  return (
    <SidebarMenuItem>
      <div
        ref={ref}
        className={cn(
          "pointer-events-none mt-1 flex h-8 items-center justify-center gap-1.5 rounded-md border border-dashed text-xs transition-colors",
          isDropTarget
            ? "border-sidebar-primary text-sidebar-primary"
            : "text-muted-foreground"
        )}
      >
        <CornerLeftUpIcon className="size-(--sidebar-icon-size)" />
        Move to top level
      </div>
    </SidebarMenuItem>
  )
}

export const CollectionTree = () => {
  const pathname = usePathname()
  const { items } = useCollectionItems()
  const collections = useAtomValue(collectionsAtom)
  const { source } = useDragOperation()

  const draggingCollectionId =
    source?.type === DRAG_TYPE.collection ? String(source.id) : null

  const excluded = useMemo(
    () =>
      new Set(
        draggingCollectionId
          ? collectDescendantIds(collections, draggingCollectionId)
          : []
      ),
    [collections, draggingCollectionId]
  )

  return (
    <>
      <SidebarMenu className="group-data-[collapsible=icon]:hidden">
        {items.map((item) => (
          <CollectionRow
            key={item.id}
            item={item}
            excluded={excluded.has(item.id)}
          />
        ))}
        {items.length === 0 ? (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            No collections yet.
          </p>
        ) : null}
        {draggingCollectionId ? <RootDropZone /> : null}
      </SidebarMenu>
      <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={pathname === "/collections"}
            tooltip="Collections"
            render={<Link href="/collections" />}
          >
            <LibraryIcon />
            <span>Collections</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  )
}
