"use client"

import { useDraggable } from "@dnd-kit/react"
import { CalendarIcon, LinkIcon, PinIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { BookmarkMenu } from "@/components/bookmark-menu"
import { CollectionIcon } from "@/components/collection-icon"
import { FaviconImage } from "@/components/favicon-image"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useBookmarkActions } from "@/hooks/use-bookmark-actions"
import { useBookmarkPreview } from "@/hooks/use-bookmark-preview"
import { useBookmarkSelected } from "@/hooks/use-bookmark-selection"
import { useCoarsePointer } from "@/hooks/use-coarse-pointer"
import { useCollection } from "@/hooks/use-collection"
import { DRAG_TYPE } from "@/lib/dnd"
import { formatDate, hostFromUrl } from "@/lib/format"
import type { BookmarkDTO } from "@/lib/types"
import { cn } from "@/lib/utils"
import type { ViewMode } from "@/lib/view-mode"

type DragProps = {
  ref: (element: Element | null) => void
  isDragSource: boolean
}

const bookmarkLabel = (bookmark: BookmarkDTO) =>
  bookmark.title?.trim() || hostFromUrl(bookmark.url)

type SelectProps = {
  selected: boolean
  selecting: boolean
  onSelect: () => void
}

const SelectToggle = ({
  bookmark,
  selected,
  selecting,
  onSelect,
  className,
}: { bookmark: BookmarkDTO; className?: string } & SelectProps) => (
  <span
    className={cn(
      "relative z-20 flex shrink-0 items-center transition-opacity",
      !selected &&
        !selecting &&
        "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100",
      className
    )}
  >
    <Checkbox
      checked={selected}
      onCheckedChange={onSelect}
      aria-label={`Select ${bookmarkLabel(bookmark)}`}
    />
  </span>
)

const MetaItem = ({
  icon,
  className,
  children,
}: {
  icon: React.ReactNode
  className?: string
  children: React.ReactNode
}) => (
  <span className={cn("flex min-w-0 items-center gap-1", className)}>
    {icon}
    <span className="truncate">{children}</span>
  </span>
)

const BookmarkMeta = ({
  bookmark,
  wrap = false,
  className,
}: {
  bookmark: BookmarkDTO
  wrap?: boolean
  className?: string
}) => {
  const collection = useCollection(bookmark.collectionId)
  const secondary = wrap ? "flex" : "hidden sm:flex"

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-x-3 gap-y-1 text-xs text-muted-foreground",
        wrap && "flex-wrap",
        className
      )}
    >
      <MetaItem icon={<LinkIcon className="size-3 shrink-0" />}>
        {hostFromUrl(bookmark.url)}
      </MetaItem>
      {collection ? (
        <MetaItem
          icon={
            <CollectionIcon
              name={collection.icon}
              className="size-3 shrink-0"
            />
          }
          className={secondary}
        >
          {collection.name}
        </MetaItem>
      ) : null}
      <MetaItem
        icon={<CalendarIcon className="size-3 shrink-0" />}
        className={cn("shrink-0", secondary)}
      >
        <time dateTime={bookmark.createdAt}>
          {formatDate(bookmark.createdAt)}
        </time>
      </MetaItem>
    </div>
  )
}

const BookmarkActions = ({
  bookmark,
  className,
}: {
  bookmark: BookmarkDTO
  className?: string
}) => {
  const { togglePin } = useBookmarkActions()

  return (
    <div className={cn("relative z-10 flex shrink-0 items-center", className)}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={bookmark.pinned ? "Unpin bookmark" : "Pin to homepage"}
        aria-pressed={bookmark.pinned}
        onClick={() => togglePin(bookmark)}
        className={
          bookmark.pinned
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }
      >
        <PinIcon className={bookmark.pinned ? "fill-current" : undefined} />
      </Button>
      <BookmarkMenu bookmark={bookmark} />
    </div>
  )
}

const BookmarkPreview = ({
  bookmark,
  pending,
}: {
  bookmark: BookmarkDTO
  pending: boolean
}) => {
  const [failed, setFailed] = useState(false)
  const [lastSrc, setLastSrc] = useState(bookmark.previewUrl)

  if (lastSrc !== bookmark.previewUrl) {
    setLastSrc(bookmark.previewUrl)
    setFailed(false)
  }

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
        <div
          className={cn(
            "flex size-full items-center justify-center",
            pending && "animate-pulse"
          )}
        >
          <FaviconImage
            src={bookmark.faviconUrl}
            className="size-8 opacity-30 grayscale"
          />
        </div>
      )}
    </div>
  )
}

const GridCard = ({
  bookmark,
  ref,
  isDragSource,
  pendingPreview,
  ...select
}: { bookmark: BookmarkDTO; pendingPreview: boolean } & DragProps &
  SelectProps) => (
  <article
    ref={ref}
    data-selected={select.selected || undefined}
    className={cn(
      "group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-foreground/20 pointer-fine:touch-none",
      isDragSource && "opacity-40",
      select.selected && "border-primary ring-1 ring-primary"
    )}
  >
    <SelectToggle
      bookmark={bookmark}
      {...select}
      className="absolute top-2 left-2 rounded-[min(var(--radius-sm),6px)] bg-background/80 p-1 backdrop-blur"
    />
    <BookmarkPreview bookmark={bookmark} pending={pendingPreview} />
    <div className="flex flex-1 flex-col gap-2 p-3">
      <div className="flex items-start gap-2">
        <FaviconImage
          src={bookmark.faviconUrl}
          className="mt-0.5 size-4 shrink-0"
        />
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 rounded-sm text-sm font-medium outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="line-clamp-2">{bookmarkLabel(bookmark)}</span>
        </a>
        <BookmarkActions bookmark={bookmark} className="-mt-1 -mr-1" />
      </div>
      {bookmark.description ? (
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {bookmark.description}
        </p>
      ) : null}
      <BookmarkMeta bookmark={bookmark} wrap className="mt-auto pt-1" />
    </div>
  </article>
)

const ListRow = ({
  bookmark,
  ref,
  isDragSource,
  ...select
}: { bookmark: BookmarkDTO } & DragProps & SelectProps) => (
  <article
    ref={ref}
    data-selected={select.selected || undefined}
    className={cn(
      "group relative flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2 transition-colors hover:border-foreground/20 sm:gap-3 pointer-fine:touch-none",
      isDragSource && "opacity-40",
      select.selected && "border-primary ring-1 ring-primary"
    )}
  >
    <SelectToggle bookmark={bookmark} {...select} />
    <FaviconImage src={bookmark.faviconUrl} className="size-5 shrink-0" />
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 rounded-sm text-sm font-medium outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="block truncate">{bookmarkLabel(bookmark)}</span>
      </a>
      <BookmarkMeta bookmark={bookmark} />
    </div>
    <BookmarkActions bookmark={bookmark} />
  </article>
)

export const BookmarkCard = ({
  bookmark,
  mode,
}: {
  bookmark: BookmarkDTO
  mode: ViewMode
}) => {
  const data = useMemo(() => ({ bookmark }), [bookmark])
  const coarsePointer = useCoarsePointer()
  const { ref, isDragSource } = useDraggable({
    id: bookmark.id,
    type: DRAG_TYPE.bookmark,
    data,
    disabled: coarsePointer,
  })

  const pendingPreview = useBookmarkPreview(bookmark, mode === "grid")

  const { selected, selecting, toggle } = useBookmarkSelected(bookmark.id)

  const select = {
    selected,
    selecting,
    onSelect: () => toggle(bookmark.id),
  }

  return mode === "grid" ? (
    <GridCard
      bookmark={bookmark}
      ref={ref}
      isDragSource={isDragSource}
      pendingPreview={pendingPreview}
      {...select}
    />
  ) : (
    <ListRow
      bookmark={bookmark}
      ref={ref}
      isDragSource={isDragSource}
      {...select}
    />
  )
}
