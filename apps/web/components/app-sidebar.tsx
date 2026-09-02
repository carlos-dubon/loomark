"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { useHydrateAtoms } from "jotai/utils"
import { HouseIcon, PlusIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { NOISE_OPACITY } from "@loomark/core/sidebar"
import type { CollectionDTO } from "@loomark/core/types"
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
import { SearchTrigger } from "@/components/search-trigger"
import { UnsortedNavItem } from "@/components/unsorted-nav-item"
import { UserMenu, type SessionUser } from "@/components/user-menu"
import {
  bookmarkDialogAtom,
  collectionDialogAtom,
  collectionsAtom,
  sidebarNoiseAtom,
  sidebarSideAtom,
} from "@/store/atoms"

const SidebarNoise = () => {
  const noise = useAtomValue(sidebarNoiseAtom)

  if (noise === "off") {
    return null
  }

  return (
    <div
      aria-hidden
      className="sidebar-noise"
      style={
        {
          "--sidebar-noise-opacity": NOISE_OPACITY[noise],
        } as React.CSSProperties
      }
    />
  )
}

export const AppSidebar = ({
  user,
  isOwner,
  collections: initialCollections,
}: {
  user: SessionUser
  isOwner: boolean
  collections: CollectionDTO[]
}) => {
  useHydrateAtoms([[collectionsAtom, initialCollections]])

  const pathname = usePathname()
  const side = useAtomValue(sidebarSideAtom)
  const setCollections = useSetAtom(collectionsAtom)
  const openBookmarkDialog = useSetAtom(bookmarkDialogAtom)
  const openCollectionDialog = useSetAtom(collectionDialogAtom)

  useEffect(() => {
    setCollections(initialCollections)
  }, [initialCollections, setCollections])

  return (
    <Sidebar collapsible="icon" side={side}>
      <SidebarHeader className="gap-2">
        <SearchTrigger />
        <Button
          className="w-full justify-start group-data-[collapsible=icon]:size-(--sidebar-icon-tile) group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-clip-border group-data-[collapsible=icon]:px-0"
          onClick={() =>
            openBookmarkDialog({
              open: true,
              bookmark: null,
              collectionId: null,
            })
          }
        >
          <PlusIcon className="size-(--sidebar-icon-size)" />
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
            <UserMenu user={user} isOwner={isOwner} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
      <SidebarNoise />
    </Sidebar>
  )
}
