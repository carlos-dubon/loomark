"use client"

import * as React from "react"

import { cn } from "@loomark/core/utils"

function Label({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"label"> & { size?: "sm" | "default" }) {
  return (
    <label
      data-slot="label"
      data-size={size}
      className={cn(
        "inline-flex items-center gap-2 font-medium text-foreground select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-64 peer-disabled:cursor-not-allowed peer-disabled:opacity-64",
        size === "sm" ? "text-xs" : "text-sm/4",
        className
      )}
      {...props}
    />
  )
}

export { Label }
