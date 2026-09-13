import "client-only"

import { dehydrate, QueryClient } from "@tanstack/react-query"

import {
  collectionList,
  queryBookmarks,
  type DemoState,
} from "@/lib/client/demo/store"
import { queryKeys, type BookmarkQuery } from "@/lib/query-keys"

const seed = (fill: (client: QueryClient) => void) => {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  })

  fill(client)

  return dehydrate(client)
}

export const seedWorkspace = (state: DemoState) =>
  seed((client) => {
    client.setQueryData(queryKeys.collections, collectionList(state))
    client.setQueryData(queryKeys.appearance, state.appearance)
  })

export const seedBookmarkLists = (state: DemoState, queries: BookmarkQuery[]) =>
  seed((client) => {
    for (const query of queries) {
      client.setQueryData(
        queryKeys.bookmarkList(query),
        queryBookmarks(state, query)
      )
    }
  })
