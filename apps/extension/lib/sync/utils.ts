import { normalizeUrl } from "@loomark/core/url"

import { isOffline, isUnauthorized } from "@/lib/api"
import type { SyncLink } from "@/lib/storage"

export const MAX_REMOTE_WRITES = 200
export const MAX_NAME = 80
export const MAX_TITLE = 300
export const UNRANKED = Number.MAX_SAFE_INTEGER

export const keyOf = (kind: SyncLink["kind"], loomarkId: string) =>
  `${kind}:${loomarkId}`

export const rethrowFatal = (cause: unknown) => {
  if (isUnauthorized(cause) || isOffline(cause)) {
    throw cause
  }
}

export const sameUrl = (a: string, b: string) => {
  try {
    return normalizeUrl(a) === normalizeUrl(b)
  } catch {
    return a === b
  }
}

export const clamp = (value: string, max: number) => value.trim().slice(0, max)
