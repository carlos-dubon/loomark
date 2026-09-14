"use client"

import { useSetAtom } from "jotai"
import { BookmarkIcon, InboxIcon, PlusIcon } from "lucide-react"
import { useMemo } from "react"

import { siblingsOf } from "@loomark/core/tree"
import { DEFAULT_GRID_COLUMNS } from "@loomark/core/view-mode"
import { Button } from "@loomark/ui/components/button"
import { CollectionIcon } from "@loomark/ui/components/collection-icon"

import { BookmarkGrid } from "@/components/bookmark-grid"
import { CollectionMenu } from "@/components/collection-menu"
import { CollectionGrid } from "@/components/collection-grid"
import { EmptyState } from "@/components/empty-state"
import { GridColumnsControl } from "@/components/grid-columns-control"
import { PageHeader } from "@/components/page-header"
import { SortOrderSelect } from "@/components/sort-order-select"
import { ViewModeToggle } from "@/components/view-mode-toggle"
import { useBookmarkList } from "@/hooks/use-bookmark-list"
import { useCollection } from "@/hooks/use-collection"
import { useCollections } from "@/hooks/use-collections"
import { useGridColumns } from "@/hooks/use-grid-columns"
import { useViewMode } from "@/hooks/use-view-mode"
import { collectionEmptyState } from "@/lib/collection-view"
import { collectionBookmarks } from "@/lib/query-keys"
import { bookmarkDialogAtom } from "@/store/atoms"

const EMPTY_ICONS = {
  bookmark: BookmarkIcon,
  inbox: InboxIcon,
}

export const BookmarkListView = ({
  collectionId,
}: {
  collectionId: string
}) => {
  const { mode } = useViewMode()
  const { columns } = useGridColumns()
  const gridColumns = mode === "grid" ? columns : DEFAULT_GRID_COLUMNS
  const collections = useCollections()
  const collection = useCollection(collectionId)
  const openBookmarkDialog = useSetAtom(bookmarkDialogAtom)
  const query = useMemo(() => collectionBookmarks(collectionId), [collectionId])
  const { items, manual } = useBookmarkList(query, "collection", collectionId)

  const addBookmark = () =>
    openBookmarkDialog({ open: true, bookmark: null, collectionId })

  const children = useMemo(
    () => siblingsOf(collections, collectionId),
    [collections, collectionId]
  )

  if (!collection) {
    return null
  }

  const { emptyIcon, emptyTitle, emptyDescription } =
    collectionEmptyState(collection)

  const hasCollections = children.length > 0
  const hasBookmarks = items.length > 0

  return (
    <>
      <PageHeader
        title={
          collection.kind === "USER" ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <CollectionIcon
                name={collection.icon}
                className="size-3.5 shrink-0"
              />
              <span className="truncate">{collection.name}</span>
            </span>
          ) : (
            collection.name
          )
        }
        description={`${items.length} ${items.length === 1 ? "bookmark" : "bookmarks"}`}
      >
        <ViewModeToggle />
        {mode === "grid" ? <GridColumnsControl /> : null}
        <SortOrderSelect />
        {collection.kind === "USER" ? (
          <CollectionMenu collection={collection} />
        ) : null}
      </PageHeader>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-6">
        {hasCollections ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Collections</h2>
            <CollectionGrid
              collections={children}
              parentId={collectionId}
              columns={gridColumns}
            />
          </section>
        ) : null}
        {hasBookmarks ? (
          <>
            {hasCollections ? (
              <h2 className="text-sm font-semibold">Bookmarks</h2>
            ) : null}
            <BookmarkGrid
              bookmarks={items}
              mode={mode}
              columns={gridColumns}
              manual={manual}
            />
          </>
        ) : hasCollections ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Bookmarks</h2>
            <EmptyState
              icon={BookmarkIcon}
              title="No bookmarks in this collection"
              description="Add a bookmark to get started."
              action={
                <Button variant="outline" onClick={addBookmark}>
                  <PlusIcon />
                  Add bookmark
                </Button>
              }
            />
          </section>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={EMPTY_ICONS[emptyIcon]}
              title={emptyTitle}
              description={emptyDescription}
              action={
                <Button variant="outline" onClick={addBookmark}>
                  <PlusIcon />
                  Add bookmark
                </Button>
              }
            />
          </div>
        )}
      </div>
    </>
  )
}
