import { queryOptions, QueryClient } from "@tanstack/react-query"

import {
  fetchMetadata,
  listCollections,
  lookupBookmark,
  type Auth,
} from "@/lib/api"
import { readLastCollectionId } from "@/lib/storage"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
})

export const collectionsQuery = (auth: Auth) =>
  queryOptions({
    queryKey: ["collections", auth.serverUrl],
    queryFn: () => listCollections(auth),
  })

export const bookmarkLookupQuery = (auth: Auth, url: string) =>
  queryOptions({
    queryKey: ["bookmark-lookup", auth.serverUrl, url],
    queryFn: () => lookupBookmark(auth, url),
  })

export const metadataQuery = (auth: Auth, url: string) =>
  queryOptions({
    queryKey: ["metadata", auth.serverUrl, url],
    queryFn: () => fetchMetadata(auth, url),
  })

export const lastCollectionIdQuery = queryOptions({
  queryKey: ["last-collection-id"],
  queryFn: () => readLastCollectionId(),
})
