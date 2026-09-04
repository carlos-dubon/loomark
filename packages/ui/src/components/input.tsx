import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@loomark/core/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <span
      data-slot="input-control"
      className={cn(
        "relative inline-flex w-full rounded-lg border border-input bg-background text-sm text-foreground shadow-xs/5 ring-ring/24 transition-shadow not-dark:bg-clip-padding before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-has-disabled:not-has-focus-visible:not-has-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] has-focus-visible:border-ring has-focus-visible:ring-3 has-disabled:opacity-64 has-aria-invalid:border-destructive/36 has-focus-visible:has-aria-invalid:border-destructive/64 has-focus-visible:has-aria-invalid:ring-destructive/16 has-[:disabled,:focus-visible,[aria-invalid]]:shadow-none dark:bg-input/32 dark:not-has-disabled:not-has-focus-visible:not-has-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/6%)] dark:has-aria-invalid:ring-destructive/24",
        className
      )}
    >
      <InputPrimitive
        type={type}
        data-slot="input"
        className={cn(
          "min-h-7.5 w-full min-w-0 rounded-[inherit] px-[calc(--spacing(3)-1px)] outline-none placeholder:text-placeholder [transition:background-color_5000000s_ease-in-out_0s] file:me-3 file:bg-transparent file:font-medium file:text-foreground file:text-sm",
          type === "search" &&
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
        )}
        {...props}
      />
    </span>
  )
}

export { Input }
