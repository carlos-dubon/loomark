"use client"

import { useState, type ComponentProps, type ReactNode } from "react"
import { Collapsible } from "react-fast-collapsible"

import { cn } from "@loomark/core/utils"

import { controlSurface } from "../lib/control"
import { Label } from "./label"
import { Switch } from "./switch"

export type FieldSize = "sm" | "default"

export const NativeSelect = ({
  className,
  size = "default",
  ...props
}: Omit<ComponentProps<"select">, "size"> & { size?: FieldSize }) => (
  <select
    data-slot="native-select"
    className={cn(
      controlSurface,
      "cursor-pointer appearance-none bg-[position:right_0.6rem_center] bg-no-repeat pr-8 text-sm",
      "[background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20opacity%3D%22.6%22%3E%3Cpath%20d%3D%22m4%206%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')]",
      size === "sm"
        ? "h-8 pl-[calc(--spacing(3)-1px)]"
        : "h-9 pl-[calc(--spacing(3)-1px)] sm:h-8",
      className
    )}
    {...props}
  />
)

export const Field = ({
  label,
  htmlFor,
  error,
  hint,
  size = "default",
  className,
  children,
}: {
  label?: ReactNode
  htmlFor?: string
  error?: string
  hint?: ReactNode
  size?: FieldSize
  className?: string
  children: ReactNode
}) => {
  const [lastError, setLastError] = useState(error)

  if (error && error !== lastError) {
    setLastError(error)
  }

  return (
    <div className={className}>
      <div className={cn("flex flex-col", size === "sm" ? "gap-1.5" : "gap-2")}>
        {label || hint ? (
          <div className="flex items-baseline justify-between gap-2">
            {label ? (
              <Label htmlFor={htmlFor} size={size}>
                {label}
              </Label>
            ) : (
              <span />
            )}
            {hint}
          </div>
        ) : null}
        {children}
      </div>
      <Collapsible
        open={Boolean(error)}
        duration={150}
        innerClassName={size === "sm" ? "pt-1.5" : "pt-2"}
      >
        <p
          key={error ? "error" : "cleared"}
          className="text-xs text-destructive"
          role={error ? "alert" : undefined}
        >
          {error || lastError}
        </p>
      </Collapsible>
    </div>
  )
}

export const SwitchField = ({
  id,
  label,
  description,
  size = "default",
  className,
  ...props
}: Omit<ComponentProps<typeof Switch>, "size" | "id"> & {
  id: string
  label: ReactNode
  description?: ReactNode
  size?: FieldSize
}) => (
  <div className={cn("flex items-center justify-between gap-4", className)}>
    <div className="flex min-w-0 flex-col gap-0.5">
      <Label htmlFor={id} size={size}>
        {label}
      </Label>
      {description ? (
        <span className="text-xs text-muted-foreground">{description}</span>
      ) : null}
    </div>
    <Switch id={id} {...props} />
  </div>
)
