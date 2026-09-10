"use client"

import type { ComponentProps, ReactNode } from "react"

import { cn } from "@loomark/core/utils"

import { controlSurface } from "../lib/control"
import { Label } from "./label"

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
}) => (
  <div
    className={cn(
      "flex flex-col",
      size === "sm" ? "gap-1.5" : "gap-2",
      className
    )}
  >
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
    {error ? (
      <p
        className={cn(
          "text-destructive",
          size === "sm" ? "text-xs" : "text-sm"
        )}
        role="alert"
      >
        {error}
      </p>
    ) : null}
  </div>
)
