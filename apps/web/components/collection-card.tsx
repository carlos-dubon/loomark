"use client"

import { Card } from "@loomark/ui/components/card"
import { CollectionIcon } from "@loomark/ui/components/collection-icon"

import { Link } from "@/components/link"

export const CollectionCard = ({
  href,
  icon,
  name,
  count,
  parentName,
}: {
  href: string
  icon: string | null | undefined
  name: string
  count: number
  parentName?: string
}) => (
  <Card
    size="sm"
    render={<Link href={href} />}
    className="flex-row items-center gap-2.5 rounded-lg px-(--card-spacing) transition-colors hover:border-input hover:bg-accent/40"
  >
    <CollectionIcon
      name={icon}
      className="size-4 shrink-0 text-muted-foreground"
    />
    <span className="flex min-w-0 flex-1 items-baseline gap-2">
      <span className="truncate text-sm font-medium">{name}</span>
      {parentName ? (
        <span className="hidden truncate text-xs text-muted-foreground/70 sm:block">
          in {parentName}
        </span>
      ) : null}
    </span>
    <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground/70 tabular-nums">
      {count}
      <span className="sr-only">{count === 1 ? "bookmark" : "bookmarks"}</span>
    </span>
  </Card>
)
