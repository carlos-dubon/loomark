"use client"

import { InboxIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { useCollectionItems } from "@/hooks/use-collection-items"

export const UnsortedNavItem = () => {
  const pathname = usePathname()
  const { unsorted } = useCollectionItems()

  if (!unsorted) {
    return null
  }

  const href = `/collections/${unsorted.id}`

  return (
    <SidebarMenuItem className="rounded-md">
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
