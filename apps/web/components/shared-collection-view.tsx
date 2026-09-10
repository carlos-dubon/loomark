import { BookmarkIcon, ChevronRightIcon } from "lucide-react"

import { plural } from "@loomark/core/format"
import { sharePath } from "@loomark/core/routes"
import type { SharedCollectionPage } from "@loomark/core/types"
import { CollectionIcon } from "@loomark/ui/components/collection-icon"

import { CollectionCard } from "@/components/collection-card"
import { EmptyState } from "@/components/empty-state"
import { Link } from "@/components/link"
import { LoomarkMark } from "@/components/loomark-mark"
import { SharedBookmarkCard } from "@/components/shared-bookmark-card"
import { THEMES } from "@/lib/themes/palettes"
import { findTheme, themeToCss } from "@/lib/themes/theme"

const Breadcrumb = ({ page }: { page: SharedCollectionPage }) => (
  <nav
    aria-label="Breadcrumb"
    className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground"
  >
    {page.trail.map((ancestor) => (
      <span key={ancestor.id} className="flex min-w-0 items-center gap-1">
        <Link
          href={sharePath(
            page.token,
            ancestor.id === page.root.id ? null : ancestor.id
          )}
          className="truncate rounded-sm hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          {ancestor.name}
        </Link>
        <ChevronRightIcon className="size-3 shrink-0" />
      </span>
    ))}
    <span className="truncate text-foreground">{page.collection.name}</span>
  </nav>
)

export const SharedCollectionView = ({
  page,
}: {
  page: SharedCollectionPage
}) => {
  const hasCollections = page.subcollections.length > 0
  const hasBookmarks = page.bookmarks.length > 0
  const themeCss = themeToCss(findTheme(THEMES, page.themeId))

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {themeCss ? (
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      ) : null}
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 md:px-6 md:py-8">
          {page.trail.length > 0 ? <Breadcrumb page={page} /> : null}
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <CollectionIcon name={page.collection.icon} className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col">
              <h1 className="truncate text-lg font-semibold">
                {page.collection.name}
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                {plural(page.bookmarks.length, "bookmark")}
                {hasCollections
                  ? ` · ${plural(page.subcollections.length, "collection")}`
                  : ""}
                {page.ownerName ? ` · shared by ${page.ownerName}` : ""}
              </p>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 md:px-6">
        {hasCollections ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Collections</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {page.subcollections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  href={sharePath(page.token, collection.id)}
                  icon={collection.icon}
                  name={collection.name}
                  count={collection.bookmarkCount}
                />
              ))}
            </div>
          </section>
        ) : null}
        {hasBookmarks ? (
          <section className="flex flex-col gap-3">
            {hasCollections ? (
              <h2 className="text-sm font-semibold">Bookmarks</h2>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {page.bookmarks.map((bookmark) => (
                <SharedBookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  token={page.token}
                />
              ))}
            </div>
          </section>
        ) : hasCollections ? null : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={BookmarkIcon}
              title="Nothing here yet"
              description="This collection has no bookmarks in it."
            />
          </div>
        )}
      </main>
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-1.5 px-4 py-6 text-xs text-muted-foreground md:px-6">
          <LoomarkMark className="size-4" />
          Shared from Loomark
        </div>
      </footer>
    </div>
  )
}
