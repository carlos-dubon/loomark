"use client"

import { GlobeIcon } from "lucide-react"
import { useState } from "react"

import { cn } from "@loomark/core/utils"

export const Favicon = ({
  src,
  className,
}: {
  src: string | null | undefined
  className?: string
}) => {
  const [failed, setFailed] = useState(false)
  const [lastSrc, setLastSrc] = useState(src)

  if (lastSrc !== src) {
    setLastSrc(src)
    setFailed(false)
  }

  if (!src || failed) {
    return (
      <GlobeIcon className={cn("size-4 text-muted-foreground", className)} />
    )
  }

  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className={cn("size-4 rounded-[4px] object-contain", className)}
    />
  )
}
