"use client"

import { DynamicIcon, type IconName } from "lucide-react/dynamic"
import { useCallback, useRef, useState } from "react"

import { cn } from "@loomark/core/utils"

import { ScrollArea } from "./scroll-area"

const OVERSCAN = 4
const MAX_COLUMNS = 8

const useElementSize = () => {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const observerRef = useRef<ResizeObserver | null>(null)

  const ref = useCallback((element: HTMLElement | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null

    if (!element) {
      return
    }

    const measure = () => {
      setSize((current) =>
        current.width === element.clientWidth &&
        current.height === element.clientHeight
          ? current
          : { width: element.clientWidth, height: element.clientHeight }
      )
    }

    measure()

    const observer = new ResizeObserver(measure)

    observer.observe(element)
    observerRef.current = observer
  }, [])

  return [ref, size] as const
}

const IconPlaceholder = () => (
  <span className="size-4 rounded-sm bg-muted-foreground/15" />
)

export type IconGridHandle = {
  scrollToTop: () => void
}

export const IconGrid = ({
  icons,
  value,
  onChange,
  minCell = 36,
  gap = 4,
  className,
  viewportClassName,
  buttonClassName,
  selectedClassName,
  handleRef,
}: {
  icons: readonly IconName[]
  value: string | null
  onChange: (value: IconName) => void
  minCell?: number
  gap?: number
  className?: string
  viewportClassName?: string
  buttonClassName?: string
  selectedClassName?: string
  handleRef?: { current: IconGridHandle | null }
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportRef, viewport] = useElementSize()
  const [sizerRef, sizer] = useElementSize()
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const frameRef = useRef<number | null>(null)

  const attachViewport = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element && frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }

      scrollRef.current = element
      viewportRef(element)

      if (handleRef) {
        handleRef.current = element
          ? {
              scrollToTop: () => {
                setScrollTop(0)
                element.scrollTo({ top: 0 })
              },
            }
          : null
      }
    },
    [viewportRef, handleRef]
  )

  const handleScroll = () => {
    if (frameRef.current !== null) {
      return
    }

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      setScrollTop(scrollRef.current?.scrollTop ?? 0)
    })
  }

  const columns = Math.min(
    MAX_COLUMNS,
    Math.max(1, Math.floor((sizer.width + gap) / (minCell + gap)))
  )
  const cell = sizer.width
    ? (sizer.width - gap * (columns - 1)) / columns
    : minCell
  const rowHeight = cell + gap
  const rowCount = Math.ceil(icons.length / columns)
  const firstRow = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN)
  const lastRow = Math.min(
    rowCount - 1,
    Math.ceil((scrollTop + viewport.height) / rowHeight) + OVERSCAN
  )

  const rows = []
  for (let row = firstRow; row <= lastRow; row++) {
    rows.push(row)
  }

  return (
    <ScrollArea
      className={className}
      viewportRef={attachViewport}
      onViewportScroll={handleScroll}
      viewportClassName={cn("scroll-fade-y", viewportClassName)}
      style={{ overflowAnchor: "none" }}
    >
      <div
        ref={sizerRef}
        className="relative w-full"
        style={{ height: Math.max(0, rowCount * rowHeight - gap) }}
      >
        {rows.map((row) => (
          <div
            key={row}
            className="absolute inset-x-0 grid"
            style={{
              top: row * rowHeight,
              height: cell,
              gap,
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {icons.slice(row * columns, row * columns + columns).map((name) => (
              <button
                key={name}
                type="button"
                title={name}
                aria-label={name}
                aria-pressed={value === name}
                onClick={() => onChange(name)}
                className={cn(
                  "flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                  buttonClassName,
                  value === name &&
                    (selectedClassName ??
                      "bg-accent text-accent-foreground ring-1 ring-foreground/20")
                )}
              >
                <DynamicIcon
                  name={name}
                  className="size-4"
                  fallback={IconPlaceholder}
                />
              </button>
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
