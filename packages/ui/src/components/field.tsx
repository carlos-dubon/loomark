import type { ComponentProps, ReactNode } from "react"

import { cn } from "@loomark/core/utils"

export const FieldLabel = ({
  className,
  ...props
}: ComponentProps<"label">) => (
  <label
    className={cn(
      "text-xs font-medium text-secondary-label select-none",
      className
    )}
    {...props}
  />
)

export const FieldInput = ({
  className,
  ...props
}: ComponentProps<"input">) => (
  <input
    className={cn(
      "h-8 w-full rounded-lg border border-input bg-background px-[calc(--spacing(3)-1px)] text-sm shadow-xs/5 ring-ring/24 transition-[color,box-shadow] outline-none not-dark:bg-clip-padding placeholder:text-placeholder focus-visible:border-ring focus-visible:ring-3 disabled:opacity-64 aria-invalid:border-destructive/36 focus-visible:aria-invalid:border-destructive/64 focus-visible:aria-invalid:ring-destructive/16 dark:bg-input/32",
      className
    )}
    {...props}
  />
)

export const FieldTextarea = ({
  className,
  ...props
}: ComponentProps<"textarea">) => (
  <textarea
    className={cn(
      "w-full resize-none px-[calc(--spacing(3)-1px)] py-[calc(--spacing(1.5)-1px)] rounded-lg border border-input bg-background text-sm shadow-xs/5 ring-ring/24 transition-[color,box-shadow] outline-none not-dark:bg-clip-padding placeholder:text-placeholder focus-visible:border-ring focus-visible:ring-3 disabled:opacity-64 aria-invalid:border-destructive/36 focus-visible:aria-invalid:border-destructive/64 focus-visible:aria-invalid:ring-destructive/16 dark:bg-input/32",
      className
    )}
    {...props}
  />
)

export const FieldSelect = ({
  className,
  ...props
}: ComponentProps<"select">) => (
  <select
    className={cn(
      "h-8 w-full cursor-pointer appearance-none bg-[position:right_0.6rem_center] bg-no-repeat pr-8 pl-[calc(--spacing(3)-1px)] rounded-lg border border-input bg-background text-sm shadow-xs/5 ring-ring/24 transition-[color,box-shadow] outline-none not-dark:bg-clip-padding placeholder:text-placeholder focus-visible:border-ring focus-visible:ring-3 disabled:opacity-64 aria-invalid:border-destructive/36 focus-visible:aria-invalid:border-destructive/64 focus-visible:aria-invalid:ring-destructive/16 dark:bg-input/32",
      "[background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20opacity%3D%22.6%22%3E%3Cpath%20d%3D%22m4%206%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')]",
      className
    )}
    {...props}
  />
)

export const Field = ({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label?: string
  htmlFor?: string
  error?: string
  children: ReactNode
  className?: string
}) => (
  <div className={cn("flex flex-col gap-1.5", className)}>
    {label ? <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel> : null}
    {children}
    {error ? (
      <p className="text-xs text-destructive-foreground" role="alert">
        {error}
      </p>
    ) : null}
  </div>
)
