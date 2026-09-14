"use client"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@loomark/core/utils"

const thumbCount = (
  value: SliderPrimitive.Root.Props["value"],
  defaultValue: SliderPrimitive.Root.Props["defaultValue"]
) => {
  const current = value ?? defaultValue

  return Array.isArray(current) ? current.length : 1
}

const Slider = ({
  className,
  children,
  defaultValue,
  value,
  min = 0,
  max = 100,
  getAriaValueText,
  ...props
}: SliderPrimitive.Root.Props &
  Pick<SliderPrimitive.Thumb.Props, "getAriaValueText">) => {
  const thumbs = thumbCount(value, defaultValue)

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("data-[orientation=horizontal]:w-full", className)}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      {children}
      <SliderPrimitive.Control
        data-slot="slider-control"
        className="flex touch-none select-none data-[orientation=horizontal]:w-full data-[orientation=horizontal]:min-w-44 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:flex-col data-disabled:pointer-events-none data-disabled:opacity-64"
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow select-none before:absolute before:rounded-full before:bg-input data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full data-[orientation=horizontal]:before:inset-x-0.5 data-[orientation=horizontal]:before:inset-y-0 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1 data-[orientation=vertical]:before:inset-x-0 data-[orientation=vertical]:before:inset-y-0.5"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-indicator"
            className="rounded-full bg-primary select-none data-[orientation=horizontal]:ms-0.5 data-[orientation=vertical]:mb-0.5"
          />
          {Array.from({ length: thumbs }, (_, index) => (
            <SliderPrimitive.Thumb
              key={index}
              index={index}
              getAriaValueText={getAriaValueText}
              data-slot="slider-thumb"
              className="block size-5 shrink-0 rounded-full border border-input bg-white shadow-xs/5 transition-[box-shadow,scale] outline-none select-none not-dark:bg-clip-padding before:absolute before:inset-0 before:rounded-full before:shadow-[0_1px_--theme(--color-black/4%)] has-focus-visible:ring-[3px] has-focus-visible:ring-ring/24 data-dragging:scale-120 sm:size-4 dark:border-background dark:has-focus-visible:ring-ring/48 [:has(*:focus-visible),[data-dragging]]:shadow-none"
            />
          ))}
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

const SliderLabel = ({ className, ...props }: SliderPrimitive.Label.Props) => (
  <SliderPrimitive.Label
    data-slot="slider-label"
    className={cn("text-sm font-medium", className)}
    {...props}
  />
)

const SliderValue = ({ className, ...props }: SliderPrimitive.Value.Props) => (
  <SliderPrimitive.Value
    data-slot="slider-value"
    className={cn("flex justify-end text-sm tabular-nums", className)}
    {...props}
  />
)

export { Slider, SliderLabel, SliderValue }
