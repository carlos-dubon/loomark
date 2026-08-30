import type { ComponentProps, ReactNode } from "react"

import { cn } from "@loomark/core"

export const Label = ({ className, ...props }: ComponentProps<"label">) => (
  <label
    className={cn("text-xs font-medium text-muted-foreground select-none", className)}
    {...props}
  />
)

export const Input = ({ className, ...props }: ComponentProps<"input">) => (
  <input
    className={cn(
      "h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
      className
    )}
    {...props}
  />
)

export const Textarea = ({ className, ...props }: ComponentProps<"textarea">) => (
  <textarea
    className={cn(
      "w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive",
      className
    )}
    {...props}
  />
)

export const Select = ({ className, ...props }: ComponentProps<"select">) => (
  <select
    className={cn(
      "h-9 w-full appearance-none rounded-md border bg-transparent bg-[position:right_0.6rem_center] bg-no-repeat py-1 pr-8 pl-3 text-sm transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
      "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m4%206%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')]",
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
    {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
    {children}
    {error ? (
      <p className="text-xs text-destructive" role="alert">
        {error}
      </p>
    ) : null}
  </div>
)
