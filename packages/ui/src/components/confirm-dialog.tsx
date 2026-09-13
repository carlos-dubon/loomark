"use client"

import { Trash2Icon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@loomark/core/utils"

import { Button } from "./button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  icon = <Trash2Icon />,
  variant = "destructive",
  pending = false,
  className,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  confirmLabel: ReactNode
  cancelLabel?: ReactNode
  icon?: ReactNode
  variant?: "destructive" | "default"
  pending?: boolean
  className?: string
  onConfirm: () => void | Promise<void>
}) => (
  <Dialog
    open={open}
    onOpenChange={(next) => {
      if (!pending) {
        onOpenChange(next)
      }
    }}
  >
    <DialogContent className={cn("sm:max-w-sm", className)}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? (
          <DialogDescription>{description}</DialogDescription>
        ) : null}
      </DialogHeader>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={pending} />}>
          {cancelLabel}
        </DialogClose>
        <Button
          variant={variant}
          loading={pending}
          onClick={() => void onConfirm()}
        >
          {icon}
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
