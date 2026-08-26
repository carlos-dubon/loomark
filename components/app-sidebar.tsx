"use client"

import { useSetAtom } from "jotai"
import { useHydrateAtoms } from "jotai/utils"
import { HouseIcon, PlusIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { CollectionTree } from "@/components/collection-tree"
import { SearchTrigger } from "@/components/search-trigger"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { UnsortedNavItem } from "@/components/unsorted-nav-item"
import { UserMenu, type SessionUser } from "@/components/user-menu"
import type { CollectionDTO } from "@/lib/types"
import {
  bookmarkDialogAtom,
  collectionDialogAtom,
  collectionsAtom,
} from "@/store/atoms"

export const AppSidebar = ({
  user,
  collections: initialCollections,
}: {
  user: SessionUser
  collections: CollectionDTO[]
}) => {
  useHydrateAtoms([[collectionsAtom, initialCollections]])

  const pathname = usePathname()
  const setCollections = useSetAtom(collectionsAtom)
  const openBookmarkDialog = useSetAtom(bookmarkDialogAtom)
  const openCollectionDialog = useSetAtom(collectionDialogAtom)

  useEffect(() => {
    setCollections(initialCollections)
  }, [initialCollections, setCollections])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-2">
        <SearchTrigger />
        <Button
          className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          onClick={() =>
            openBookmarkDialog({
              open: true,
              bookmark: null,
              collectionId: null,
            })
          }
        >
          <PlusIcon />
          <span className="group-data-[collapsible=icon]:hidden">
            New bookmark
          </span>
        </Button>
      </SidebarHeader>
      <SidebarContent className="scroll-fade-y">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/"}
                  tooltip="Homepage"
                  render={<Link href="/" />}
                >
                  <HouseIcon />
                  <span>Homepage</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <UnsortedNavItem />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Collections</SidebarGroupLabel>
          <SidebarGroupAction
            aria-label="New collection"
            onClick={() =>
              openCollectionDialog({
                open: true,
                collection: null,
                parentId: null,
              })
            }
          >
            <PlusIcon />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <CollectionTree />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu user={user} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
