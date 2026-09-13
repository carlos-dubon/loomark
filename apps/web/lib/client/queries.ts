import "client-only"

import { queryOptions, type QueryClient } from "@tanstack/react-query"

import { collectDescendantIds } from "@loomark/core/tree"
import type { BookmarkDTO, CollectionDTO } from "@loomark/core/types"

import { api } from "@/lib/client/api"
import { queryKeys, type BookmarkQuery } from "@/lib/query-keys"

const UPDATE_CHECK_MS = 21_600_000

export const appearanceQuery = queryOptions({
  queryKey: queryKeys.appearance,
  queryFn: () => api.getAppearance(),
})

export const collectionsQuery = queryOptions({
  queryKey: queryKeys.collections,
  queryFn: () => api.listCollections(),
})

export const bookmarkListQuery = (query: BookmarkQuery) =>
  queryOptions({
    queryKey: queryKeys.bookmarkList(query),
    queryFn: ({ signal }) => api.listBookmarks(query, signal),
  })

export const metadataQuery = (url: string) =>
  queryOptions({
    queryKey: queryKeys.metadata(url),
    queryFn: ({ signal }) => api.fetchMetadata(url, signal),
  })

export const updateStatusQuery = queryOptions({
  queryKey: queryKeys.updateStatus,
  queryFn: ({ signal }) => api.updateStatus({ signal }),
  staleTime: UPDATE_CHECK_MS,
  refetchInterval: UPDATE_CHECK_MS,
})

export const invalidateLibrary = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks }),
    queryClient.invalidateQueries({ queryKey: queryKeys.collections }),
  ])

export const upsertBookmarkInCache = (
  queryClient: QueryClient,
  bookmark: BookmarkDTO
) =>
  queryClient.setQueriesData<BookmarkDTO[]>(
    { queryKey: queryKeys.bookmarks },
    (items) => items?.map((item) => (item.id === bookmark.id ? bookmark : item))
  )

export const removeBookmarksFromCache = (
  queryClient: QueryClient,
  ids: Iterable<string>
) => {
  const removed = new Set(ids)

  queryClient.setQueriesData<BookmarkDTO[]>(
    { queryKey: queryKeys.bookmarks },
    (items) => items?.filter((item) => !removed.has(item.id))
  )
}

export const upsertCollectionInCache = (
  queryClient: QueryClient,
  collection: CollectionDTO
) =>
  queryClient.setQueryData(collectionsQuery.queryKey, (collections = []) =>
    collections.some((item) => item.id === collection.id)
      ? collections.map((item) =>
          item.id === collection.id ? collection : item
        )
      : [...collections, collection]
  )

export const removeCollectionFromCache = (
  queryClient: QueryClient,
  id: string
) =>
  queryClient.setQueryData(collectionsQuery.queryKey, (collections) => {
    if (!collections) {
      return collections
    }

    const removed = new Set(collectDescendantIds(collections, id))

    return collections.filter((collection) => !removed.has(collection.id))
  })
