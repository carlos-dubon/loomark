import { errorMessage } from "@loomark/core/format"

import { fetchSyncSnapshot, isUnauthorized, type Auth } from "@/lib/api"
import {
  bookmarksBarId,
  hasBookmarksPermission,
  readSubtree,
} from "@/lib/bookmarks"
import {
  clearSyncLinks,
  readConnection,
  readSyncLinks,
  readSyncSettings,
  readSyncStatus,
  writeSyncLinks,
  writeSyncSettings,
  writeSyncStatus,
  type SyncStatus,
} from "@/lib/storage"
import { createContext, type SyncContext } from "@/lib/sync/context"
import { propagateDeletions } from "@/lib/sync/deletions"
import { dissolveUnsortedFolder } from "@/lib/sync/legacy"
import { mergeLinks } from "@/lib/sync/merge"
import { syncOrder } from "@/lib/sync/order"
import { pullBookmarks, pullCollections } from "@/lib/sync/pull"
import { pushFolders, pushLinks } from "@/lib/sync/push"

const reconcile = async (context: SyncContext) => {
  await dissolveUnsortedFolder(context)
  await propagateDeletions(context)
  await pullCollections(context)
  await pushFolders(context)
  await pullBookmarks(context)
  await pushLinks(context)
  await mergeLinks(context)
  await syncOrder(context)
}

let running = false

export const runSync = async (): Promise<SyncStatus> => {
  const settings = await readSyncSettings()

  if (!settings.enabled) {
    return readSyncStatus()
  }

  if (running) {
    return readSyncStatus()
  }

  running = true

  const previous = await readSyncStatus()

  await writeSyncStatus({ ...previous, running: true, startedAt: Date.now() })

  const finish = async (error: string | null) => {
    const status: SyncStatus = {
      at: error ? previous.at : Date.now(),
      running: false,
      startedAt: null,
      error,
    }

    await writeSyncStatus(status)
    running = false

    return status
  }

  try {
    if (!(await hasBookmarksPermission())) {
      return await finish("Loomark needs permission to read your bookmarks")
    }

    const connection = await readConnection()

    if (!connection) {
      return await finish("Connect Loomark to sync")
    }

    const auth: Auth = {
      serverUrl: connection.serverUrl,
      token: connection.token,
    }

    const rootId = await bookmarksBarId()

    if (!rootId) {
      return await finish("Could not find your bookmarks bar")
    }

    if (rootId !== settings.rootId) {
      await clearSyncLinks()
      await writeSyncSettings({ ...settings, rootId })
    }

    const nodeList = await readSubtree(rootId)

    if (!nodeList) {
      return await finish("Could not read your bookmarks bar")
    }

    const context = createContext({
      auth,
      rootId,
      remote: await fetchSyncSnapshot(auth),
      nodeList,
      stored: await readSyncLinks(),
    })

    let failure: unknown = null

    try {
      await reconcile(context)
    } catch (cause) {
      failure = cause
    }

    await writeSyncLinks([...context.links.values()])

    if (failure) {
      throw failure
    }

    return await finish(null)
  } catch (cause) {
    if (isUnauthorized(cause)) {
      return await finish("Your Loomark session expired. Reconnect to sync.")
    }

    return await finish(errorMessage(cause, "Sync failed"))
  }
}
