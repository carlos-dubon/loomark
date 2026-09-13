"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSetAtom } from "jotai"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

import { errorMessage } from "@loomark/core/format"
import type { CollectionDeletion, CollectionDTO } from "@loomark/core/types"

import { api } from "@/lib/client/api"
import {
  collectionsQuery,
  invalidateLibrary,
  removeBookmarksFromCache,
  removeCollectionFromCache,
} from "@/lib/client/queries"
import { queryKeys } from "@/lib/query-keys"
import { deselectBookmarksAtom } from "@/store/atoms"

export const useCollectionDelete = () => {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const deselectBookmarks = useSetAtom(deselectBookmarksAtom)

  const { mutate: restore } = useMutation({
    mutationFn: ({
      deletion,
    }: {
      deletion: CollectionDeletion
      name: string
    }) => api.restoreCollection(deletion),
    onSuccess: (collections, { name }) => {
      queryClient.setQueryData(collectionsQuery.queryKey, collections)
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks })
      toast.success(`“${name}” restored`)
    },
    onError: (cause) => {
      toast.error(errorMessage(cause, "Restore failed"))
    },
  })

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (collection: CollectionDTO) =>
      api.deleteCollection(collection.id),
    onSuccess: (deletion, collection) => {
      const bookmarkIds = deletion.bookmarks.map((bookmark) => bookmark.id)

      removeCollectionFromCache(queryClient, collection.id)
      removeBookmarksFromCache(queryClient, bookmarkIds)
      deselectBookmarks(bookmarkIds)

      if (
        deletion.collections.some((removed) =>
          pathname.startsWith(`/collections/${removed.id}`)
        )
      ) {
        router.push("/")
      }

      void invalidateLibrary(queryClient)

      toast.success(`Deleted “${collection.name}”`, {
        action: {
          label: "Undo",
          onClick: () => restore({ deletion, name: collection.name }),
        },
      })
    },
    onError: (cause) => {
      toast.error(errorMessage(cause, "Delete failed"))
    },
  })

  const destroy = async (collection: CollectionDTO) => {
    await mutateAsync(collection).catch(() => null)
  }

  return { destroy, pending: isPending }
}
