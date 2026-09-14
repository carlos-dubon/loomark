"use client"

import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@loomark/core/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = (props: PopoverPrimitive.Trigger.Props) => (
  <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
)

const PopoverContent = ({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Positioner
      className="isolate z-50 outline-none"
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
    >
      <PopoverPrimitive.Popup
        data-slot="popover-content"
        className={cn(
          "z-50 max-h-(--available-height) origin-(--transform-origin) rounded-lg p-4 text-popover-foreground shadow-[0_16px_40px_-18px_rgb(0_0_0/55%)] dropdown-glass transition-[scale,opacity] duration-150 outline-none data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:scale-98 data-starting-style:opacity-0 dark:shadow-[0_18px_44px_-18px_rgb(0_0_0/80%)]",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Positioner>
  </PopoverPrimitive.Portal>
)

export { Popover, PopoverContent, PopoverTrigger }
