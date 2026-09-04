import * as React from "react"

import { cn } from "@loomark/core/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-sm bg-muted-foreground/15 motion-safe:animate-skeleton",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
