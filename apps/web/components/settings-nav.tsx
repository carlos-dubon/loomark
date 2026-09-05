"use client"

import {
  ArchiveIcon,
  ArrowLeftIcon,
  ArrowLeftRightIcon,
  ServerIcon,
  SettingsIcon,
  UserRoundIcon,
} from "lucide-react"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@loomark/ui/components/sidebar"

import { Link } from "@/components/link"
import { useCloseSidebar } from "@/hooks/use-close-sidebar"

const SETTINGS_ROUTES = ["/settings", "/admin"]

export const isSettingsRoute = (pathname: string) =>
  SETTINGS_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

const ITEMS = [
  { href: "/settings", label: "General", icon: SettingsIcon, owner: false },
  {
    href: "/settings/profile",
    label: "Your profile",
    icon: UserRoundIcon,
    owner: false,
  },
  {
    href: "/settings/archive",
    label: "Archive",
    icon: ArchiveIcon,
    owner: false,
  },
  {
    href: "/settings/import-export",
    label: "Import and export",
    icon: ArrowLeftRightIcon,
    owner: false,
  },
  {
    href: "/admin",
    label: "Server administration",
    icon: ServerIcon,
    owner: true,
  },
]

export const SettingsNav = ({ isOwner }: { isOwner: boolean }) => {
  const pathname = usePathname()
  const closeSidebar = useCloseSidebar()

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Back to bookmarks"
                onClick={closeSidebar}
                render={<Link href="/" />}
              >
                <ArrowLeftIcon />
                <span>Back to bookmarks</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Settings</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {ITEMS.filter((item) => isOwner || !item.owner).map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  onClick={closeSidebar}
                  render={<Link href={item.href} />}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}
