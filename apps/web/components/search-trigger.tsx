"use client"

import { useSetAtom } from "jotai"
import { SearchIcon } from "lucide-react"
import { useSyncExternalStore } from "react"

import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { searchDialogAtom } from "@/store/atoms"

const subscribe = () => () => {}
const getIsMac = () => navigator.userAgent.includes("Mac OS X")
const getIsMacOnServer = () => false

export const SearchTrigger = () => {
  const setOpen = useSetAtom(searchDialogAtom)
  const isMac = useSyncExternalStore(subscribe, getIsMac, getIsMacOnServer)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          variant="outline"
          tooltip="Search for bookmarks"
          aria-label="Search for bookmarks"
          onClick={() => setOpen(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <SearchIcon />
          <span className="truncate group-data-[collapsible=icon]:hidden">
            Search for bookmarks
          </span>
          <KbdGroup className="ml-auto shrink-0 group-data-[collapsible=icon]:hidden">
            <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
