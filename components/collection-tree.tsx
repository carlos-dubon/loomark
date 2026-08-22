"use client"

import { FolderIcon, LibraryIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useCollectionItems } from "@/hooks/use-collection-items"
import type { FlatCollection } from "@/lib/tree"

const INDENT_WIDTH = 16

const CollectionRow = ({ item }: { item: FlatCollection }) => {
  const pathname = usePathname()
  const href = `/collections/${item.id}`

  return (
    <SidebarMenuItem>
      <div
        className="relative rounded-md"
        style={{ marginLeft: item.depth * INDENT_WIDTH }}
      >
        <SidebarMenuButton
          isActive={pathname === href}
          tooltip={item.name}
          className="w-full min-w-0 pr-8"
          render={<Link href={href} />}
        >
          <FolderIcon />
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
  const { items } = useCollectionItems()

  return (
    <>
      <SidebarMenu className="group-data-[collapsible=icon]:hidden">
        {items.map((item) => (
          <CollectionRow key={item.id} item={item} />
        ))}
        {items.length === 0 ? (
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
