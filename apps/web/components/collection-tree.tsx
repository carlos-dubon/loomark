"use client"

import { pointerIntersection } from "@dnd-kit/collision"
import { useDroppable } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import { LibraryIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useCallback, useMemo } from "react"

import type { FlatCollection } from "@loomark/core/tree"
import { cn } from "@loomark/core/utils"
import { CollectionIcon } from "@loomark/ui/components/collection-icon"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@loomark/ui/components/sidebar"

import { Link } from "@/components/link"
import { useCloseSidebar } from "@/hooks/use-close-sidebar"
import { useCollectionTree } from "@/hooks/use-collection-tree"
import {
  COLLECTION_DROP_PRIORITY,
  DRAG_TYPE,
  TREE_GROUP,
  TREE_INDENT,
  type CollectionDropData,
} from "@/lib/dnd"

const CollectionRow = ({
  item,
  index,
}: {
  item: FlatCollection
  index: number
}) => {
  const pathname = usePathname()
  const closeSidebar = useCloseSidebar()
  const href = `/collections/${item.id}`

  const dropData = useMemo<CollectionDropData>(
    () => ({ collectionId: item.id }),
    [item.id]
  )

  const { ref: sortableRef } = useSortable({
    id: item.id,
    index,
    group: TREE_GROUP,
    type: DRAG_TYPE.collection,
    accept: DRAG_TYPE.collection,
    alignment: { x: "start", y: "center" },
    transition: { idle: true },
  })

  const { ref: dropRef, isDropTarget } = useDroppable({
    id: `row-bookmarks:${item.id}`,
    accept: DRAG_TYPE.bookmark,
    collisionDetector: pointerIntersection,
    collisionPriority: COLLECTION_DROP_PRIORITY,
    data: dropData,
  })

  const setRowRef = useCallback(
    (element: HTMLDivElement | null) => {
      sortableRef(element)
      dropRef(element)
    },
    [sortableRef, dropRef]
  )

  return (
    <SidebarMenuItem>
      <div
        ref={setRowRef}
        className={cn(
          "relative rounded-md",
          "[&[data-dnd-dragging]]:bg-sidebar-row-selected [&[data-dnd-dragging]]:shadow-lg [&[data-dnd-dragging]]:ring-sidebar-border",
          "[&[data-dnd-placeholder]]:visible! [&[data-dnd-placeholder]]:bg-primary/10 [&[data-dnd-placeholder]]:ring-primary/70 [&[data-dnd-placeholder]]:ring-inset [&[data-dnd-placeholder]]:*:opacity-70",
          isDropTarget &&
            "ring-2 ring-primary/70 ring-offset-1 ring-offset-sidebar"
        )}
        style={{ marginLeft: item.depth * TREE_INDENT }}
      >
        <SidebarMenuButton
          isActive={pathname === href}
          tooltip={item.name}
          className="w-full min-w-0 pr-8"
          onClick={closeSidebar}
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
    </SidebarMenuItem>
  )
}

export const CollectionTree = () => {
  const pathname = usePathname()
  const closeSidebar = useCloseSidebar()
  const { rows } = useCollectionTree()

  return (
    <>
      <SidebarMenu className="group-data-[collapsible=icon]:hidden">
        {rows.map((item, index) => (
          <CollectionRow key={item.id} item={item} index={index} />
        ))}
        {rows.length === 0 ? (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            No collections yet.
          </p>
        ) : null}
      </SidebarMenu>
      <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={pathname === "/collections"}
            tooltip="Collections"
            onClick={closeSidebar}
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
