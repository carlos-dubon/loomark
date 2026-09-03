import { routes } from "@loomark/core/routes"
import type {
  Account,
  BookmarkDTO,
  CollectionDeletion,
  CollectionDTO,
  SyncOrderGroup,
  SyncSnapshot,
  UrlMetadata,
} from "@loomark/core/types"
export type Auth = { serverUrl: string; token: string }

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export const isUnauthorized = (error: unknown) =>
  error instanceof ApiError && error.status === 401

export const isOffline = (error: unknown) =>
  error instanceof ApiError && error.status === 0

const endpoint = (serverUrl: string, path: string) =>
  new URL(path, serverUrl).toString()

const send = async <T>(
  serverUrl: string,
  path: string,
  init: RequestInit & { token?: string } = {}
): Promise<T> => {
  const { token, headers, ...rest } = init

  let response: Response

  try {
    response = await fetch(endpoint(serverUrl, path), {
      ...rest,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    })
  } catch {
    throw new ApiError("Could not reach that server", 0)
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string
    } | null

    throw new ApiError(
      payload?.error ?? `Request failed (${response.status})`,
      response.status
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

const authed = <T>(auth: Auth, path: string, init: RequestInit = {}) =>
  send<T>(auth.serverUrl, path, { ...init, token: auth.token })

export const connect = (
  serverUrl: string,
  credentials: { email: string; password: string }
) =>
  send<{ token: string; user: Account }>(serverUrl, routes.extensionToken, {
    method: "POST",
    body: JSON.stringify({ ...credentials, name: "Browser extension" }),
  })

export const verify = (auth: Auth) =>
  authed<{ user: Account }>(auth, routes.extensionToken)

export const disconnect = (auth: Auth) =>
  authed<void>(auth, routes.extensionToken, { method: "DELETE" })

export const listCollections = (auth: Auth) =>
  authed<CollectionDTO[]>(auth, routes.collections)

export const createCollection = (
  auth: Auth,
  input: { name: string; icon: string | null; parentId: string | null }
) =>
  authed<CollectionDTO>(auth, routes.collections, {
    method: "POST",
    body: JSON.stringify(input),
  })

export const updateCollection = (
  auth: Auth,
  id: string,
  input: { name?: string; parentId?: string | null }
) =>
  authed<CollectionDTO>(auth, routes.collection(id), {
    method: "PATCH",
    body: JSON.stringify(input),
  })

export const deleteCollection = (auth: Auth, id: string) =>
  authed<CollectionDeletion>(auth, routes.collection(id), { method: "DELETE" })

export const fetchSyncSnapshot = (auth: Auth) =>
  authed<SyncSnapshot>(auth, routes.sync)

export const pushSyncOrder = (auth: Auth, groups: SyncOrderGroup[]) =>
  authed<void>(auth, routes.sync, {
    method: "POST",
    body: JSON.stringify({ groups }),
  })

export const lookupBookmark = (auth: Auth, url: string) =>
  authed<BookmarkDTO | null>(auth, routes.bookmarkLookup(url))

export const createBookmark = (
  auth: Auth,
  input: {
    url: string
    title?: string
    description?: string | null
    collectionId: string | null
    pinned: boolean
  }
) =>
  authed<BookmarkDTO>(auth, routes.bookmarks, {
    method: "POST",
    body: JSON.stringify(input),
  })

export const updateBookmark = (
  auth: Auth,
  id: string,
  input: {
    url?: string
    title?: string
    description?: string | null
    collectionId?: string | null
    pinned?: boolean
  }
) =>
  authed<BookmarkDTO>(auth, routes.bookmark(id), {
    method: "PATCH",
    body: JSON.stringify(input),
  })

export const deleteBookmark = (auth: Auth, id: string) =>
  authed<void>(auth, routes.bookmark(id), { method: "DELETE" })

export const fetchMetadata = (auth: Auth, url: string) =>
  authed<UrlMetadata>(auth, routes.metadata(url))
