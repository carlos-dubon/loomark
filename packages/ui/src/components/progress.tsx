"use client"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"

import { cn } from "@loomark/core/utils"

type Tone = "default" | "destructive" | "muted"

function Progress({
  className,
  tone = "default",
  ...props
}: ProgressPrimitive.Root.Props & { tone?: Tone }) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-tone={tone}
      className={cn("group/progress flex w-full flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      data-slot="progress-track"
      className={cn(
        "relative h-1 w-full overflow-hidden rounded-full bg-input",
        className
      )}
      {...props}
    />
  )
}

function ProgressIndicator({
  className,
  ...props
}: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn(
        "absolute rounded-full bg-primary transition-[width] duration-500 ease-out group-data-[tone=destructive]/progress:bg-destructive group-data-[tone=muted]/progress:bg-muted-foreground motion-reduce:transition-none",
        className
      )}
      {...props}
    />
  )
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      data-slot="progress-label"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      data-slot="progress-value"
      className={cn("text-xs text-muted-foreground tabular-nums", className)}
      {...props}
    />
  )
}

export {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
}
