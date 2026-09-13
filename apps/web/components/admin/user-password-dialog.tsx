"use client"

import { KeyRoundIcon, ShuffleIcon } from "lucide-react"
import * as React from "react"
import { useState } from "react"
import { toast } from "sonner"

import { errorMessage } from "@loomark/core/format"
import type { InstanceUserDTO } from "@loomark/core/types"
import { Button } from "@loomark/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@loomark/ui/components/dialog"
import { Field } from "@loomark/ui/components/field"
import { Input } from "@loomark/ui/components/input"

import { api } from "@/lib/client/api"

const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"

const generatePassword = () =>
  Array.from(
    crypto.getRandomValues(new Uint32Array(20)),
    (value) => ALPHABET[value % ALPHABET.length]
  ).join("")

export const UserPasswordDialog = ({
  user,
  onOpenChange,
}: {
  user: InstanceUserDTO | null
  onOpenChange: (open: boolean) => void
}) => {
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)

  const tooShort = password.length < 8

  const onSubmit = async () => {
    if (!user || tooShort) {
      return
    }

    setPending(true)

    try {
      await api.resetUserPassword(user.id, password)
      toast.success(`Password updated for ${user.email}`)
      setPassword("")
      onOpenChange(false)
    } catch (cause) {
      toast.error(errorMessage(cause, "Reset failed"))
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={Boolean(user)}
      onOpenChange={(open) => {
        if (pending) {
          return
        }

        if (!open) {
          setPassword("")
        }

        onOpenChange(open)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a new password for {user?.email}. It is shown here in plain text
            so you can hand it over, and it will not be shown again.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            void onSubmit()
          }}
        >
          <Field label="New password" htmlFor="new-password">
            <div className="flex gap-2">
              <Input
                id="new-password"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={password}
                disabled={pending}
                aria-invalid={password.length > 0 && tooShort}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(event.target.value)
                }
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Generate a password"
                disabled={pending}
                onClick={() => setPassword(generatePassword())}
              >
                <ShuffleIcon />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              At least 8 characters. Their signed in sessions keep working until
              they expire.
            </p>
          </Field>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={pending} />}>
            Cancel
          </DialogClose>
          <Button
            disabled={tooShort}
            loading={pending}
            onClick={() => void onSubmit()}
          >
            <KeyRoundIcon aria-hidden="true" />
            {pending ? "Setting…" : "Set password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
