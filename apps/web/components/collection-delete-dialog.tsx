"use client"

import { useAtom, useAtomValue } from "jotai"
import { Loader2Icon, Trash2Icon } from "lucide-react"
import { useState } from "react"

import { collectDescendantIds } from "@loomark/core/tree"
import type { CollectionDTO } from "@loomark/core/types"
import { Button } from "@loomark/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@loomark/ui/components/dialog"

import { useCollectionDelete } from "@/hooks/use-collection-delete"
import { collectionDeleteDialogAtom, collectionsAtom } from "@/store/atoms"

type Doomed = {
  id: string
  name: string
  nested: number
  bookmarks: number
}

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`

const summarize = (
  collection: CollectionDTO,
  collections: CollectionDTO[]
): Doomed => {
  const doomed = new Set(collectDescendantIds(collections, collection.id))

  return {
    id: collection.id,
    name: collection.name,
    nested: doomed.size - 1,
    bookmarks: collections
      .filter((item) => doomed.has(item.id))
      .reduce((sum, item) => sum + item.bookmarkCount, 0),
  }
}

export const CollectionDeleteDialog = () => {
  const [collection, setCollection] = useAtom(collectionDeleteDialogAtom)
  const collections = useAtomValue(collectionsAtom)
  const { destroy, pending } = useCollectionDelete()

  const [doomed, setDoomed] = useState<Doomed | null>(null)

  if (collection && collection.id !== doomed?.id) {
    setDoomed(summarize(collection, collections))
  }

  return (
    <Dialog
      open={collection !== null}
      onOpenChange={(open) => {
        if (!open && !pending) {
          setCollection(null)
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete “{doomed?.name}”?</DialogTitle>
          <DialogDescription>
            {doomed && doomed.nested > 0 ? (
              <>
                This also deletes {plural(doomed.nested, "nested collection")}
                .{" "}
              </>
            ) : null}
            {doomed && doomed.bookmarks > 0 ? (
              <>{plural(doomed.bookmarks, "bookmark")} will be deleted too. </>
            ) : null}
            You can undo this from the toast.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={pending} />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={async () => {
              if (!collection) {
                return
              }

              await destroy(collection)
              setCollection(null)
            }}
          >
            {pending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <Trash2Icon />
            )}
            Delete collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
