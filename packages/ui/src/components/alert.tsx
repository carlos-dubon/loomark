import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@loomark/core/utils"

const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-x-2.5 gap-y-0.5 rounded-xl border px-3.5 py-3 text-sm text-card-foreground has-[>svg]:grid-cols-[--spacing(4)_1fr] [&>svg]:size-4 [&>svg]:translate-y-0.5",
  {
    variants: {
      variant: {
        default: "bg-transparent [&>svg]:text-muted-foreground dark:bg-input/32",
        error:
          "border-error/32 bg-error-surface text-error-foreground [&>svg]:text-error",
        info: "border-info/32 bg-info/4 [&>svg]:text-info",
        success: "border-success/32 bg-success/4 [&>svg]:text-success",
        warning:
          "border-warning/32 bg-warning-surface text-warning-foreground [&>svg]:text-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("col-start-2 min-w-0 font-medium", className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 min-w-0 text-current/80 [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("col-start-2 mt-1.5 flex gap-1", className)}
      {...props}
    />
  )
}

export { Alert, AlertAction, AlertDescription, AlertTitle }
