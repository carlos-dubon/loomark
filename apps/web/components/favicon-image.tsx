"use client"

import { GlobeIcon } from "lucide-react"
import { useState } from "react"

import { routes } from "@loomark/core/routes"
import { cn } from "@loomark/core/utils"

import { isDemo } from "@/lib/demo/config"

export const FaviconImage = ({
  src,
  className,
  proxy = routes.favicon,
}: {
  src: string | null
  className?: string
  proxy?: (url: string) => string
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
    if (src.startsWith("/api/")) return src
    if (isDemo) return src
    return proxy(src)
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
