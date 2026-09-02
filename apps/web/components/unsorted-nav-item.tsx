"use client"

import { pointerIntersection } from "@dnd-kit/collision"
import { useDroppable } from "@dnd-kit/react"
import { InboxIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useMemo } from "react"

import { cn } from "@loomark/core/utils"
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@loomark/ui/components/sidebar"

import { Link } from "@/components/link"
import { useCollectionItems } from "@/hooks/use-collection-items"
import { DRAG_TYPE, DROP_PRIORITY, type DropTargetData } from "@/lib/dnd"

export const UnsortedNavItem = () => {
  const pathname = usePathname()
  const { unsorted } = useCollectionItems()

  const data = useMemo<DropTargetData>(
    () => ({ zone: "into", collectionId: unsorted?.id }),
    [unsorted?.id]
  )

  const { ref, isDropTarget } = useDroppable({
    id: "into:unsorted",
    accept: DRAG_TYPE.bookmark,
    collisionDetector: pointerIntersection,
    collisionPriority: DROP_PRIORITY.row,
    data,
    disabled: !unsorted,
  })

  if (!unsorted) {
    return null
  }

  const href = `/collections/${unsorted.id}`

  return (
    <SidebarMenuItem
      ref={ref}
      className={cn(
        "rounded-md",
        isDropTarget &&
          "ring-2 ring-sidebar-primary/70 ring-offset-1 ring-offset-sidebar"
      )}
    >
      <SidebarMenuButton
        isActive={pathname === href}
        tooltip={unsorted.name}
        render={<Link href={href} />}
      >
        <InboxIcon />
        <span>{unsorted.name}</span>
        {unsorted.totalCount > 0 ? (
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {unsorted.totalCount}
          </span>
        ) : null}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
