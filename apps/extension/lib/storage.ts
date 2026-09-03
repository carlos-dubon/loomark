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

export type SyncLink = {
  kind: "collection" | "bookmark"
  loomarkId: string
  nodeId: string
  title: string
  url: string | null
  parentLoomarkId: string | null
  index: number
}

export type SyncSettings = {
  enabled: boolean
  rootId: string | null
}

export type SyncStatus = {
  at: number | null
  running: boolean
  startedAt: number | null
  error: string | null
}

const syncSettingsItem = storage.defineItem<SyncSettings>(
  "local:syncSettings",
  { fallback: { enabled: false, rootId: null } }
)

const syncLinksItem = storage.defineItem<SyncLink[]>("local:syncLinks", {
  fallback: [],
})

const syncStatusItem = storage.defineItem<SyncStatus>("local:syncStatus", {
  fallback: { at: null, running: false, startedAt: null, error: null },
})

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

export const readSyncSettings = () => syncSettingsItem.getValue()

export const writeSyncSettings = (settings: SyncSettings) =>
  syncSettingsItem.setValue(settings)

export const watchSyncSettings = (listener: (settings: SyncSettings) => void) =>
  syncSettingsItem.watch(listener)

export const readSyncLinks = () => syncLinksItem.getValue()

export const writeSyncLinks = (links: SyncLink[]) =>
  syncLinksItem.setValue(links)

export const clearSyncLinks = () => syncLinksItem.removeValue()

export const readSyncStatus = () => syncStatusItem.getValue()

export const writeSyncStatus = (status: SyncStatus) =>
  syncStatusItem.setValue(status)

export const watchSyncStatus = (listener: (status: SyncStatus) => void) =>
  syncStatusItem.watch(listener)
