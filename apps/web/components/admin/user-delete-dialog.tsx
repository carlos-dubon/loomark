"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { errorMessage, plural } from "@loomark/core/format"
import type { InstanceUserDTO } from "@loomark/core/types"
import { ConfirmDialog } from "@loomark/ui/components/confirm-dialog"

import { api } from "@/lib/client-api"

export const UserDeleteDialog = ({
  user,
  onOpenChange,
}: {
  user: InstanceUserDTO | null
  onOpenChange: (open: boolean) => void
}) => {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const destroy = async () => {
    if (!user) {
      return
    }

    setPending(true)

    try {
      await api.deleteUser(user.id)
      toast.success(`${user.email} deleted`)
      onOpenChange(false)
      router.refresh()
    } catch (cause) {
      toast.error(errorMessage(cause, "Delete failed"))
    } finally {
      setPending(false)
    }
  }

  return (
    <ConfirmDialog
      open={Boolean(user)}
      onOpenChange={onOpenChange}
      pending={pending}
      className="sm:max-w-md"
      title="Delete this account?"
      description={
        <>
          {user?.email} loses access immediately, and their{" "}
          {plural(user?.bookmarkCount ?? 0, "bookmark")} across{" "}
          {plural(user?.collectionCount ?? 0, "collection")} are erased. This
          cannot be undone.
        </>
      }
      confirmLabel="Delete account"
      onConfirm={destroy}
    />
  )
}
