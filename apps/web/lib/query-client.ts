import { isServer, QueryClient } from "@tanstack/react-query"

const STALE_MS = 60_000

export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: STALE_MS },
    },
  })

let browserQueryClient: QueryClient | undefined

export const getQueryClient = () => {
  if (isServer) {
    return makeQueryClient()
  }

  browserQueryClient ??= makeQueryClient()

  return browserQueryClient
}
