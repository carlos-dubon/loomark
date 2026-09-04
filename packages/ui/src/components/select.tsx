"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@loomark/core/utils"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

const Select = SelectPrimitive.Root

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1", className)}
      {...props}
    />
  )
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      {...props}
    />
  )
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "relative flex w-fit cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-background px-[calc(--spacing(3)-1px)] text-base whitespace-nowrap shadow-xs/5 ring-ring/24 transition-[color,box-shadow,background-color] outline-none select-none not-dark:bg-clip-padding before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-data-disabled:not-focus-visible:not-aria-invalid:not-data-popup-open:before:shadow-[0_1px_--theme(--color-black/4%)] focus-visible:border-ring focus-visible:ring-3 aria-invalid:border-destructive/36 focus-visible:aria-invalid:border-destructive/64 focus-visible:aria-invalid:ring-destructive/16 data-placeholder:text-placeholder data-[size=default]:h-9 data-[size=sm]:h-8 data-[size=sm]:rounded-md data-[size=sm]:px-[calc(--spacing(2.5)-1px)] data-[size=sm]:before:rounded-[calc(var(--radius-md)-1px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 sm:text-sm sm:data-[size=default]:h-8 sm:data-[size=sm]:h-7 dark:bg-input/32 dark:not-data-disabled:not-focus-visible:not-aria-invalid:not-data-popup-open:before:shadow-[0_-1px_--theme(--color-white/6%)] dark:aria-invalid:ring-destructive/24 data-disabled:pointer-events-none data-disabled:opacity-64 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-icon-muted [[data-disabled],:focus-visible,[aria-invalid],[data-popup-open]]:shadow-none",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon
            data-slot="select-icon"
            className="pointer-events-none -me-1 size-4 opacity-80"
          />
        }
      />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  popupClassName,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  matchTriggerWidth = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  > & {
    popupClassName?: string
    matchTriggerWidth?: boolean
  }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50 select-none"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            "relative isolate z-50 origin-(--transform-origin) rounded-lg text-popover-foreground transition-[scale,opacity] duration-150 outline-none data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:scale-98 data-starting-style:opacity-0 data-[align-trigger=true]:transition-none",
            popupClassName
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <div
            className={cn(
              "relative h-full rounded-lg shadow-[0_16px_40px_-18px_rgb(0_0_0/55%)] dropdown-glass dark:shadow-[0_18px_44px_-18px_rgb(0_0_0/80%)]",
              matchTriggerWidth && "min-w-(--anchor-width)"
            )}
          >
            <SelectPrimitive.List
              data-slot="select-list"
              className={cn(
                "max-h-(--available-height) overflow-x-hidden overflow-y-auto p-1",
                className
              )}
            >
              {children}
            </SelectPrimitive.List>
          </div>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn(
        "px-2 py-1.5 text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  showCheck = false,
  ...props
}: SelectPrimitive.Item.Props & {
  showCheck?: boolean
}) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "flex min-h-7 cursor-pointer items-center rounded-sm px-2 py-1 text-sm text-foreground outline-none select-none focus:bg-accent focus:text-accent-foreground in-data-[side=none]:min-w-[calc(var(--anchor-width)+1.25rem)] data-highlighted:bg-accent data-highlighted:text-accent-foreground data-selected:bg-foreground/8 data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-64 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        showCheck && "gap-2",
        className
      )}
      {...props}
    >
      {showCheck ? (
        <SelectPrimitive.ItemIndicator
          data-slot="select-item-indicator"
          keepMounted
          className="flex w-4 shrink-0 items-center justify-center"
        >
          <CheckIcon className="opacity-0 in-data-[selected]:opacity-100" />
        </SelectPrimitive.ItemIndicator>
      ) : null}
      <SelectPrimitive.ItemText
        data-slot="select-item-text"
        className="min-w-0 flex-1 [&_svg:not([class*='text-'])]:text-muted-foreground"
      >
        {children}
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none mx-2 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-50 flex h-6 w-full cursor-default items-center justify-center before:pointer-events-none before:absolute before:inset-x-px before:top-px before:h-[200%] before:rounded-t-[calc(var(--radius-lg)-1px)] before:bg-linear-to-b before:from-popover before:from-50% [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="relative" />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-50 flex h-6 w-full cursor-default items-center justify-center before:pointer-events-none before:absolute before:inset-x-px before:bottom-px before:h-[200%] before:rounded-b-[calc(var(--radius-lg)-1px)] before:bg-linear-to-t before:from-popover before:from-50% [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="relative" />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
