"use client"

import { LoaderCircleIcon } from "lucide-react"

import { cn } from "@loomark/core/utils"

export const Spinner = ({
  className,
  "aria-hidden": ariaHidden,
  role,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<typeof LoaderCircleIcon>) => {
  const hidden = ariaHidden === true || ariaHidden === "true"

  return (
    <LoaderCircleIcon
      data-slot="spinner"
      className={cn("animate-spin", className)}
      aria-hidden={ariaHidden}
      role={role ?? (hidden ? undefined : "status")}
      aria-label={ariaLabel ?? (hidden ? undefined : "Loading")}
      {...props}
    />
  )
}
