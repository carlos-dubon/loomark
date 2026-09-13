"use client"

import { useSetAtom } from "jotai"
import { FolderTreeIcon, PlusIcon } from "lucide-react"

import { Button } from "@loomark/ui/components/button"

import { CollectionCard } from "@/components/collection-card"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { useCollectionItems } from "@/hooks/use-collection-items"
import { collectionDialogAtom } from "@/store/atoms"

export const CollectionsView = () => {
  const { items } = useCollectionItems()
  const openCollectionDialog = useSetAtom(collectionDialogAtom)

  const addCollection = () =>
    openCollectionDialog({ open: true, collection: null, parentId: null })

  const names = new Map(items.map((item) => [item.id, item.name]))

  return (
    <>
      <PageHeader
        title="Collections"
        description={`${items.length} ${items.length === 1 ? "collection" : "collections"}`}
      >
        <Button variant="outline" onClick={addCollection}>
          <PlusIcon />
          New collection
        </Button>
      </PageHeader>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-6">
        {items.length === 0 ? (
          <EmptyState
            icon={FolderTreeIcon}
            title="No collections yet"
            description="Group your bookmarks into collections and they will all show up here."
            action={
              <Button variant="outline" onClick={addCollection}>
                <PlusIcon />
                Create your first collection
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {items.map((item) => (
              <CollectionCard
                key={item.id}
                href={`/collections/${item.id}`}
                icon={item.icon}
                name={item.name}
                count={item.totalCount}
                parentName={
                  item.parentId ? names.get(item.parentId) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
