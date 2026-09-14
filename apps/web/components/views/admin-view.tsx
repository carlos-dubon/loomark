"use client"

import {
  BookmarkIcon,
  CrownIcon,
  FolderIcon,
  HardDriveIcon,
  KeyRoundIcon,
  MoreHorizontalIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react"
import { useState } from "react"

import { formatBytes, formatDate } from "@loomark/core/format"
import type { InstanceUserDTO } from "@loomark/core/types"
import { Button } from "@loomark/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@loomark/ui/components/dropdown-menu"

import { UserDeleteDialog } from "@/components/admin/user-delete-dialog"
import { UserPasswordDialog } from "@/components/admin/user-password-dialog"
import { SettingsCard, SettingsPage } from "@/components/settings/settings-page"
import { UserAvatar } from "@/components/user-avatar"

const Stat = ({
  icon: Icon,
  label,
}: {
  icon: typeof UsersIcon
  label: string
}) => (
  <span className="flex items-center gap-1.5 whitespace-nowrap">
    <Icon className="size-3.5 shrink-0" />
    {label}
  </span>
)

export const AdminView = ({
  users,
  ownerId,
}: {
  users: InstanceUserDTO[]
  ownerId: string
}) => {
  const [resetting, setResetting] = useState<InstanceUserDTO | null>(null)
  const [deleting, setDeleting] = useState<InstanceUserDTO | null>(null)

  const totalBytes = users.reduce((sum, user) => sum + user.bytes, 0)
  const totalBookmarks = users.reduce(
    (sum, user) => sum + user.bookmarkCount,
    0
  )

  return (
    <>
      <SettingsPage
        title="Server administration"
        description="Accounts on this instance"
      >
        <SettingsCard
          title="This instance"
          description={
            <>
              {users.length} {users.length === 1 ? "account" : "accounts"},{" "}
              {totalBookmarks} {totalBookmarks === 1 ? "bookmark" : "bookmarks"}
              , {formatBytes(totalBytes)} in total.
            </>
          }
        />
        <SettingsCard title="Accounts">
          <div className="flex flex-col divide-y">
            {users.map((user) => {
              const label = user.name ?? user.email
              const isOwner = user.role === "OWNER"

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <UserAvatar
                    user={user}
                    className="size-9 shrink-0"
                    fallbackClassName="text-xs"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {label}
                      </span>
                      {isOwner ? (
                        <span className="flex shrink-0 items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          <CrownIcon className="size-3" />
                          Owner
                        </span>
                      ) : null}
                      {user.id === ownerId ? (
                        <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          You
                        </span>
                      ) : null}
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email} · joined {formatDate(user.createdAt)}
                    </span>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <Stat
                        icon={BookmarkIcon}
                        label={`${user.bookmarkCount} bookmarks`}
                      />
                      <Stat
                        icon={FolderIcon}
                        label={`${user.collectionCount} collections`}
                      />
                      <Stat
                        icon={HardDriveIcon}
                        label={`${formatBytes(user.bytes)} total`}
                      />
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Manage ${user.email}`}
                        />
                      }
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setResetting(user)}>
                        <KeyRoundIcon />
                        Reset password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={isOwner}
                        onClick={() => setDeleting(user)}
                      >
                        <Trash2Icon />
                        Delete account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        </SettingsCard>
      </SettingsPage>
      <UserPasswordDialog
        user={resetting}
        onOpenChange={(open) => {
          if (!open) {
            setResetting(null)
          }
        }}
      />
      <UserDeleteDialog
        user={deleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null)
          }
        }}
      />
    </>
  )
}
