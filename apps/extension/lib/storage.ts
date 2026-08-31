import { storage } from "wxt/utils/storage"

import type { Connection } from "@loomark/core/types"

const connectionItem = storage.defineItem<Connection | null>(
  "local:connection",
  { fallback: null }
)

const draftServerUrlItem = storage.defineItem<string | null>(
  "local:draftServerUrl",
  { fallback: null }
)

const lastCollectionItem = storage.defineItem<string | null>(
  "local:lastCollectionId",
  { fallback: null }
)

export const readConnection = () => connectionItem.getValue()

export const writeConnection = (connection: Connection) =>
  connectionItem.setValue(connection)

export const clearConnection = () => connectionItem.removeValue()

export const watchConnection = (
  listener: (connection: Connection | null) => void
) => connectionItem.watch(listener)

export const readLastCollectionId = () => lastCollectionItem.getValue()

export const writeLastCollectionId = (id: string | null) =>
  lastCollectionItem.setValue(id)

export const readDraftServerUrl = () => draftServerUrlItem.getValue()

export const writeDraftServerUrl = (serverUrl: string) =>
  draftServerUrlItem.setValue(serverUrl)

export const clearDraftServerUrl = () => draftServerUrlItem.removeValue()
