"use client"

import { PinIcon } from "lucide-react"

import { BookmarkMenu } from "@/components/bookmark-menu"
import { FaviconImage } from "@/components/favicon-image"
import { formatDate, hostFromUrl } from "@/lib/format"
import type { BookmarkDTO } from "@/lib/types"
import type { ViewMode } from "@/store/atoms"

const GridCard = ({ bookmark }: { bookmark: BookmarkDTO }) => (
  <article className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-foreground/20">
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-1 flex-col outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {bookmark.previewUrl ? (
        <div className="aspect-[16/9] overflow-hidden border-b bg-muted">
          <img
            src={bookmark.previewUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <FaviconImage src={bookmark.faviconUrl} />
          <span className="truncate text-xs text-muted-foreground">
            {hostFromUrl(bookmark.url)}
          </span>
          {bookmark.pinned ? (
            <PinIcon className="size-3 shrink-0 text-muted-foreground" />
          ) : null}
        </div>
        <p className="line-clamp-2 text-sm font-medium">{bookmark.title}</p>
        {bookmark.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {bookmark.description}
          </p>
        ) : null}
        <time
          dateTime={bookmark.createdAt}
          className="mt-auto pt-1 text-xs text-muted-foreground"
        >
          Saved {formatDate(bookmark.createdAt)}
        </time>
      </div>
    </a>
    <BookmarkMenu bookmark={bookmark} className="absolute top-2 right-2" />
  </article>
)

const ListRow = ({ bookmark }: { bookmark: BookmarkDTO }) => (
  <article className="group relative flex items-center gap-3 rounded-lg border bg-card px-3 py-2 transition-colors hover:border-foreground/20">
    <FaviconImage src={bookmark.faviconUrl} className="size-4 shrink-0" />
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="min-w-0 flex-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <p className="truncate text-sm font-medium">{bookmark.title}</p>
      <p className="truncate text-xs text-muted-foreground">
        {hostFromUrl(bookmark.url)}
        {bookmark.description ? ` · ${bookmark.description}` : ""}
      </p>
    </a>
    <time
      dateTime={bookmark.createdAt}
      className="hidden shrink-0 text-xs text-muted-foreground sm:block"
    >
      {formatDate(bookmark.createdAt)}
    </time>
    {bookmark.pinned ? (
      <PinIcon className="size-3 shrink-0 text-muted-foreground" />
    ) : null}
    <BookmarkMenu bookmark={bookmark} className="shrink-0" />
  </article>
)

export const BookmarkCard = ({
  bookmark,
  mode,
}: {
  bookmark: BookmarkDTO
  mode: ViewMode
}) =>
  mode === "grid" ? (
    <GridCard bookmark={bookmark} />
  ) : (
    <ListRow bookmark={bookmark} />
  )
