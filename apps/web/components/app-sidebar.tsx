"use client"

import { useSetAtom } from "jotai"
import { HouseIcon, PlusIcon } from "lucide-react"
import { usePathname } from "next/navigation"

import { Button } from "@loomark/ui/components/button"
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
} from "@loomark/ui/components/sidebar"

import { CollectionTree } from "@/components/collection-tree"
import { Link } from "@/components/link"
import { SearchTrigger } from "@/components/search-trigger"
import { isSettingsRoute, SettingsNav } from "@/components/settings-nav"
import { UnsortedNavItem } from "@/components/unsorted-nav-item"
import { UserMenu, type SessionUser } from "@/components/user-menu"
import { useCloseSidebar } from "@/hooks/use-close-sidebar"
import { bookmarkDialogAtom, collectionDialogAtom } from "@/store/atoms"

export const AppSidebar = ({
  user,
  isOwner,
}: {
  user: SessionUser
  isOwner: boolean
}) => {
  const pathname = usePathname()
  const openBookmarkDialog = useSetAtom(bookmarkDialogAtom)
  const openCollectionDialog = useSetAtom(collectionDialogAtom)
  const closeSidebar = useCloseSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-2">
        <SearchTrigger />
        <Button
          className="w-full justify-start group-data-[collapsible=icon]:size-(--sidebar-icon-tile) group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-clip-border group-data-[collapsible=icon]:px-0"
          onClick={() => {
            closeSidebar()
            openBookmarkDialog({
              open: true,
              bookmark: null,
              collectionId: null,
            })
          }}
        >
          <PlusIcon className="size-(--sidebar-icon-size)" />
          <span className="group-data-[collapsible=icon]:hidden">
            New bookmark
          </span>
        </Button>
      </SidebarHeader>
      <SidebarContent className="scroll-fade-y">
        {isSettingsRoute(pathname) ? (
          <SettingsNav isOwner={isOwner} />
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={pathname === "/"}
                      tooltip="Homepage"
                      onClick={closeSidebar}
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
                onClick={() => {
                  closeSidebar()
                  openCollectionDialog({
                    open: true,
                    collection: null,
                    parentId: null,
                  })
                }}
              >
                <PlusIcon />
              </SidebarGroupAction>
              <SidebarGroupContent>
                <CollectionTree />
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
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
