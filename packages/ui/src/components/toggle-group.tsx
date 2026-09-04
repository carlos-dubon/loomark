"use client"

import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import type { VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@loomark/core/utils"

import { Toggle, type toggleVariants } from "./toggle"

type ToggleVariants = VariantProps<typeof toggleVariants>

const ToggleGroupContext = React.createContext<ToggleVariants>({
  variant: "default",
  size: "default",
})

function ToggleGroup({
  className,
  variant = "default",
  size = "default",
  orientation = "horizontal",
  children,
  ...props
}: ToggleGroupPrimitive.Props & ToggleVariants) {
  const context = React.useMemo(() => ({ variant, size }), [variant, size])

  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      orientation={orientation}
      className={cn(
        "flex w-fit gap-0.5 *:focus-visible:z-10",
        orientation === "horizontal"
          ? "*:pointer-coarse:after:min-w-auto"
          : "flex-col *:pointer-coarse:after:min-h-auto",
        variant === "segmented" && "rounded-lg bg-input/40 p-0.5",
        className
      )}
      {...props}
    >
      <ToggleGroupContext value={context}>{children}</ToggleGroupContext>
    </ToggleGroupPrimitive>
  )
}

function ToggleGroupItem({
  variant,
  size,
  ...props
}: React.ComponentProps<typeof Toggle>) {
  const context = React.use(ToggleGroupContext)

  return (
    <Toggle
      variant={variant ?? context.variant}
      size={size ?? context.size}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
