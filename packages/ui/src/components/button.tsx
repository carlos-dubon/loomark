import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@loomark/core/utils"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--control-radius)] border text-sm font-medium whitespace-nowrap outline-none transition-[box-shadow,scale,background-color] select-none before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--control-radius)-1px)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background active:scale-[0.97] disabled:pointer-events-none disabled:opacity-64 aria-invalid:border-destructive/36 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-[var(--control-icon-color,currentColor)]",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground shadow-xs shadow-primary/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] hover:bg-primary/90 active:inset-shadow-[0_1px_--theme(--color-black/8%)] disabled:shadow-none aria-expanded:bg-primary/90",
        outline:
          "[--control-icon-color:var(--muted-foreground)] border-input bg-background text-foreground shadow-xs/5 not-dark:bg-clip-padding not-disabled:not-active:before:shadow-[0_1px_--theme(--color-black/4%)] hover:bg-accent/50 active:shadow-none disabled:shadow-none aria-expanded:bg-accent/50 dark:bg-input/32 dark:not-disabled:not-active:before:shadow-[0_-1px_--theme(--color-white/6%)] dark:hover:bg-input/64 dark:aria-expanded:bg-input/64",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/80 aria-expanded:bg-secondary/90",
        ghost:
          "[--control-icon-color:var(--muted-foreground)] border-transparent text-foreground hover:bg-accent aria-expanded:bg-accent",
        "ghost-muted":
          "[--control-icon-color:var(--muted-foreground)] border-transparent text-muted-foreground hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground",
        destructive:
          "border-destructive bg-destructive text-white shadow-xs shadow-destructive/24 not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] hover:bg-destructive/90 active:inset-shadow-[0_1px_--theme(--color-black/8%)] disabled:shadow-none",
        "destructive-outline":
          "border-input bg-background text-destructive-foreground shadow-xs/5 not-dark:bg-clip-padding not-disabled:not-active:before:shadow-[0_1px_--theme(--color-black/4%)] hover:border-destructive/32 hover:bg-destructive/4 active:shadow-none disabled:shadow-none dark:bg-input/32 dark:not-disabled:not-active:before:shadow-[0_-1px_--theme(--color-white/6%)]",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-[calc(--spacing(3)-1px)]",
        lg: "h-9 px-[calc(--spacing(3.5)-1px)]",
        sm: "h-7 gap-1.5 px-[calc(--spacing(2.5)-1px)] text-sm",
        xs: "h-6 gap-1 rounded-md px-[calc(--spacing(2)-1px)] text-xs before:rounded-[calc(var(--radius-md)-1px)] [&_svg:not([class*='size-'])]:size-3.5",
        icon: "size-8",
        "icon-lg": "size-9",
        "icon-sm": "size-7",
        "icon-xs":
          "size-6 rounded-md before:rounded-[calc(var(--radius-md)-1px)] [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = ButtonPrimitive.Props &
  Omit<VariantProps<typeof buttonVariants>, "size"> & {
    size?: VariantProps<typeof buttonVariants>["size"] | "iconSm"
  }

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  const normalizedSize = size === "iconSm" ? "icon-sm" : size

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size: normalizedSize, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
