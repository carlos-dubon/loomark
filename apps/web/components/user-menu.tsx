"use client"

import { useQueryClient } from "@tanstack/react-query"
import {
  ChevronsUpDownIcon,
  LogOutIcon,
  SettingsIcon,
  SunMoonIcon,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@loomark/ui/components/dropdown-menu"
import { SidebarMenuButton } from "@loomark/ui/components/sidebar"

import { Link } from "@/components/link"
import { UserAvatar } from "@/components/user-avatar"
import { useCloseSidebar } from "@/hooks/use-close-sidebar"
import { useThemeMode } from "@/hooks/use-theme-mode"
import { isDemo } from "@/lib/demo/config"
import { signOut as demoSignOut } from "@/lib/client/demo/store"
import { THEME_MODE_OPTIONS, toThemeMode } from "@/lib/theme-mode"

export type SessionUser = {
  name: string | null
  email: string
  image: string | null
}

export const UserMenu = ({ user }: { user: SessionUser }) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { mode, select } = useThemeMode()
  const closeSidebar = useCloseSidebar()
  const label = user.name ?? user.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<SidebarMenuButton size="lg" className="h-11 gap-2" />}
      >
        <UserAvatar
          user={user}
          className="size-7 group-data-[collapsible=icon]:size-(--sidebar-icon-tile)"
          fallbackClassName="text-xs"
        />
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
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunMoonIcon />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-40 min-w-40">
            <DropdownMenuRadioGroup
              value={mode}
              onValueChange={(value) => select(toThemeMode(value))}
            >
              {THEME_MODE_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  <option.icon />
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            if (isDemo) {
              demoSignOut()
              queryClient.clear()
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
