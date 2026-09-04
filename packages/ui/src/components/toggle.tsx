"use client"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@loomark/core/utils"

const toggleVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border text-base font-medium whitespace-nowrap text-foreground transition-shadow outline-none select-none before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 data-pressed:bg-input/64 data-pressed:text-accent-foreground sm:text-sm pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-transparent",
        ghost:
          "border-transparent text-foreground shadow-none before:shadow-none hover:bg-accent disabled:text-muted-foreground disabled:opacity-100 data-pressed:bg-accent data-pressed:text-accent-foreground disabled:[&_svg]:opacity-100",
        outline:
          "border-input bg-background shadow-xs/5 not-dark:bg-clip-padding not-disabled:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] disabled:shadow-none dark:bg-input/32 dark:not-disabled:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/6%)] dark:hover:bg-input/64 dark:data-pressed:bg-input",
        segmented:
          "rounded-md border-transparent text-muted-foreground shadow-none transition-colors before:rounded-[calc(var(--radius-md)-1px)] before:shadow-none hover:bg-background/55 hover:text-foreground data-pressed:bg-background data-pressed:text-foreground data-pressed:shadow-xs/10 dark:hover:bg-input/32 dark:data-pressed:bg-input/72",
      },
      size: {
        default: "h-9 min-w-9 px-[calc(--spacing(2)-1px)] sm:h-8 sm:min-w-8",
        lg: "h-10 min-w-10 px-[calc(--spacing(2.5)-1px)] sm:h-9 sm:min-w-9",
        sm: "h-8 min-w-8 px-[calc(--spacing(1.5)-1px)] sm:h-7 sm:min-w-7",
        xs: "h-7 min-w-7 rounded-md px-[calc(--spacing(1)-1px)] sm:h-6 sm:min-w-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
