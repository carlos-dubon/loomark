"use client"

import { Loader2Icon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api } from "@/lib/client-api"
import type { InstanceUserDTO } from "@/lib/types"

const plural = (count: number, word: string) =>
  `${count} ${count === 1 ? word : `${word}s`}`

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
      toast.error(cause instanceof Error ? cause.message : "Delete failed")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={Boolean(user)}
      onOpenChange={(open) => {
        if (!pending) {
          onOpenChange(open)
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this account?</DialogTitle>
          <DialogDescription>
            {user?.email} loses access immediately, and their{" "}
            {plural(user?.bookmarkCount ?? 0, "bookmark")} across{" "}
            {plural(user?.collectionCount ?? 0, "collection")} are erased. This
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={pending} />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => void destroy()}
          >
            {pending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <Trash2Icon />
            )}
            Delete account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
