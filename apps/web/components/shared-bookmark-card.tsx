"use client"

import { useState } from "react"

import { formatDate } from "@loomark/core/format"
import { routes } from "@loomark/core/routes"
import type { SharedBookmarkDTO } from "@loomark/core/types"
import { hostFromUrl } from "@loomark/core/url"

import { FaviconImage } from "@/components/favicon-image"

const Preview = ({
  bookmark,
  proxy,
}: {
  bookmark: SharedBookmarkDTO
  proxy: (url: string) => string
}) => {
  const [failed, setFailed] = useState(false)
  const src = failed ? null : bookmark.previewUrl

  return (
    <div className="aspect-[16/9] shrink-0 overflow-hidden border-b bg-muted/50">
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <FaviconImage
            src={bookmark.faviconUrl}
            proxy={proxy}
            className="size-8 opacity-30 grayscale"
          />
        </div>
      )}
    </div>
  )
}

export const SharedBookmarkCard = ({
  bookmark,
  token,
}: {
  bookmark: SharedBookmarkDTO
  token: string
}) => {
  const proxy = (url: string) => routes.shareFavicon(token, url)

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-foreground/20">
      <Preview bookmark={bookmark} proxy={proxy} />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start gap-2">
          <FaviconImage
            src={bookmark.faviconUrl}
            proxy={proxy}
            className="mt-0.5 size-4 shrink-0"
          />
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="min-w-0 flex-1 rounded-sm text-sm font-medium outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          >
            <span className="line-clamp-2">
              {bookmark.title?.trim() || hostFromUrl(bookmark.url)}
            </span>
          </a>
        </div>
        {bookmark.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {bookmark.description}
          </p>
        ) : null}
        <div className="mt-auto flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
          <span className="truncate">{hostFromUrl(bookmark.url)}</span>
          <time dateTime={bookmark.createdAt} className="shrink-0">
            {formatDate(bookmark.createdAt)}
          </time>
        </div>
      </div>
    </article>
  )
}
