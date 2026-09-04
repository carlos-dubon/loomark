import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@loomark/core/utils"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--control-radius)] border text-base font-medium whitespace-nowrap transition-[box-shadow,scale,background-color] outline-none select-none before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--control-radius)-1px)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background active:scale-[0.97] disabled:pointer-events-none disabled:opacity-64 aria-invalid:border-destructive/36 sm:text-sm pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-[var(--control-icon-color,currentColor)]",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground shadow-xs shadow-primary/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] hover:bg-primary/90 active:inset-shadow-[0_1px_--theme(--color-black/8%)] disabled:shadow-none aria-expanded:bg-primary/90",
        outline:
          "border-input bg-background text-foreground shadow-xs/5 [--control-icon-color:var(--muted-foreground)] not-dark:bg-clip-padding not-disabled:not-active:before:shadow-[0_1px_--theme(--color-black/4%)] hover:bg-accent/50 active:shadow-none disabled:shadow-none aria-expanded:bg-accent/50 dark:bg-input/32 dark:not-disabled:not-active:before:shadow-[0_-1px_--theme(--color-white/6%)] dark:hover:bg-input/64 dark:aria-expanded:bg-input/64",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/80 aria-expanded:bg-secondary/90",
        ghost:
          "border-transparent text-foreground [--control-icon-color:var(--muted-foreground)] hover:bg-accent aria-expanded:bg-accent",
        "ghost-muted":
          "border-transparent text-muted-foreground [--control-icon-color:var(--muted-foreground)] hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground",
        glass:
          "border-border/60 text-foreground shadow-sm surface-glass [--control-icon-color:var(--muted-foreground)] hover:border-border aria-expanded:border-border",
        destructive:
          "border-destructive bg-destructive text-white shadow-xs shadow-destructive/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] hover:bg-destructive/90 active:inset-shadow-[0_1px_--theme(--color-black/8%)] disabled:shadow-none",
        "destructive-outline":
          "border-input bg-background text-destructive-foreground shadow-xs/5 not-dark:bg-clip-padding not-disabled:not-active:before:shadow-[0_1px_--theme(--color-black/4%)] hover:border-destructive/32 hover:bg-destructive/4 active:shadow-none disabled:shadow-none dark:bg-input/32 dark:not-disabled:not-active:before:shadow-[0_-1px_--theme(--color-white/6%)]",
        "warning-outline":
          "border-warning/32 bg-warning-surface text-warning-foreground shadow-xs/5 hover:border-warning/40 hover:bg-warning/16 active:shadow-none disabled:shadow-none dark:hover:bg-warning/24",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-[calc(--spacing(3)-1px)] sm:h-8",
        lg: "h-10 px-[calc(--spacing(3.5)-1px)] sm:h-9",
        xl: "h-11 px-[calc(--spacing(4)-1px)] text-lg sm:h-10 sm:text-base [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
        sm: "h-8 gap-1.5 px-[calc(--spacing(2.5)-1px)] sm:h-7",
        xs: "h-7 gap-1 px-[calc(--spacing(2)-1px)] text-sm sm:h-6 sm:text-xs [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-3.5",
        compact:
          "h-7 gap-1 rounded-md px-[calc(--spacing(2)-1px)] text-xs before:rounded-[calc(var(--radius-md)-1px)] [&_svg:not([class*='size-'])]:size-3.5",
        micro:
          "h-5 gap-1 rounded-sm px-[calc(--spacing(1.5)-1px)] text-[11px] before:rounded-[calc(var(--radius-sm)-1px)] sm:text-[11px] [&_svg:not([class*='size-'])]:size-3 sm:[&_svg:not([class*='size-'])]:size-3",
        icon: "size-9 sm:size-8",
        "icon-lg": "size-10 sm:size-9",
        "icon-xl":
          "size-11 sm:size-10 [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
        "icon-sm": "size-8 sm:size-7",
        "icon-xs":
          "size-7 rounded-md before:rounded-[calc(var(--radius-md)-1px)] sm:size-6 [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-3.5",
        "icon-micro":
          "size-5 rounded-sm p-0 before:rounded-[calc(var(--radius-sm)-1px)] [&_svg:not([class*='size-'])]:size-3 sm:[&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
