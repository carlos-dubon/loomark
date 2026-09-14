import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@loomark/core/utils"

const emptyMediaVariants = cva(
  "flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "relative size-9 rounded-md border bg-card text-foreground shadow-sm/5 not-dark:bg-clip-padding before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-md)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] dark:before:shadow-[0_-1px_--theme(--color-white/6%)] [&_svg:not([class*='size-'])]:size-4.5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Empty = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="empty"
    className={cn(
      "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center text-balance md:py-20",
      className
    )}
    {...props}
  />
)

const EmptyHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="empty-header"
    className={cn("flex max-w-sm flex-col items-center text-center", className)}
    {...props}
  />
)

const EmptyMedia = ({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) => (
  <div data-slot="empty-media" data-variant={variant} className="relative mb-6">
    {variant === "icon" ? (
      <>
        <div
          aria-hidden="true"
          className={cn(
            emptyMediaVariants({ variant }),
            "pointer-events-none absolute bottom-px origin-bottom-left -translate-x-0.5 scale-84 -rotate-10 shadow-none"
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            emptyMediaVariants({ variant }),
            "pointer-events-none absolute bottom-px origin-bottom-right translate-x-0.5 scale-84 rotate-10 shadow-none"
          )}
        />
      </>
    ) : null}
    <div
      className={cn(emptyMediaVariants({ variant }), className)}
      {...props}
    />
  </div>
)

const EmptyTitle = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="empty-title"
    className={cn("text-xl font-semibold", className)}
    {...props}
  />
)

const EmptyDescription = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    data-slot="empty-description"
    className={cn(
      "text-sm text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary [[data-slot=empty-title]+&]:mt-1",
      className
    )}
    {...props}
  />
)

const EmptyContent = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="empty-content"
    className={cn(
      "flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance",
      className
    )}
    {...props}
  />
)

export {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
}
