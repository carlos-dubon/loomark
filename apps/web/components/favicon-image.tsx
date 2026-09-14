"use client"

import { routes } from "@loomark/core/routes"
import { Favicon } from "@loomark/ui/components/favicon"

import { isDemo } from "@/lib/demo/config"

const proxied = (src: string | null) => {
  if (!src) return null
  if (src.startsWith("data:")) return src
  if (src.startsWith("/api/")) return src
  if (isDemo) return src
  return routes.favicon(src)
}

export const FaviconImage = ({
  src,
  className,
}: {
  src: string | null
  className?: string
}) => <Favicon src={proxied(src)} className={className} />
