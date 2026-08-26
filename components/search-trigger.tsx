"use client"

import { useSetAtom } from "jotai"
import { SearchIcon } from "lucide-react"
import { useSyncExternalStore } from "react"

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
          <kbd className="ml-auto rounded border bg-background px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground group-data-[collapsible=icon]:hidden">
            {isMac ? "⌘ K" : "Ctrl K"}
          </kbd>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
