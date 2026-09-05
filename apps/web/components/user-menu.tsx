"use client"

import {
  ChevronsUpDownIcon,
  LogOutIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@loomark/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@loomark/ui/components/dropdown-menu"
import { SidebarMenuButton } from "@loomark/ui/components/sidebar"

import { Link } from "@/components/link"
import { useCloseSidebar } from "@/hooks/use-close-sidebar"
import { useThemeToggle } from "@/hooks/use-theme-toggle"
import { isDemo } from "@/lib/demo/config"
import { signOut as demoSignOut } from "@/lib/demo/store"

export type SessionUser = {
  name: string | null
  email: string
  image: string | null
}

export const UserMenu = ({ user }: { user: SessionUser }) => {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const toggleTheme = useThemeToggle()
  const closeSidebar = useCloseSidebar()
  const label = user.name ?? user.email
  const initials = label.slice(0, 2).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<SidebarMenuButton size="lg" className="h-11 gap-2" />}
      >
        <Avatar className="size-7 group-data-[collapsible=icon]:size-(--sidebar-icon-tile)">
          {user.image ? <AvatarImage src={user.image} alt={label} /> : null}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left leading-tight">
          <span className="truncate text-sm font-medium">{label}</span>
          <span className="truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        </div>
        <ChevronsUpDownIcon className="ml-auto opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56 min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={closeSidebar}
          render={<Link href="/settings" />}
        >
          <SettingsIcon />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme}>
          {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
          Toggle theme
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            if (isDemo) {
              demoSignOut()
              router.push("/login")

              return
            }

            void signOut({ redirectTo: "/login" })
          }}
        >
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
