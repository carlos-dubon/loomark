"use client"

import { GlobeIcon } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"

export const FaviconImage = ({
  src,
  className,
}: {
  src: string | null
  className?: string
}) => {
  const [failed, setFailed] = useState(false)
  const [lastSrc, setLastSrc] = useState(src)

  if (lastSrc !== src) {
    setLastSrc(src)
    setFailed(false)
  }

  const proxiedSrc = (() => {
    if (!src) return null
    if (src.startsWith("data:")) return src
    if (src.startsWith("/api/favicon")) return src
    return `/api/favicon?url=${encodeURIComponent(src)}`
  })()

  if (!proxiedSrc || failed) {
    return (
      <GlobeIcon className={cn("size-4 text-muted-foreground", className)} />
    )
  }

  return (
    <img
      src={proxiedSrc}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("size-4 rounded-[4px] object-contain", className)}
    />
  )
}
