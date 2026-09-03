import { ArrowLeftIcon, Loader2Icon, RefreshCwIcon } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@loomark/ui/components/button"
import { Field, FieldSelect } from "@loomark/ui/components/field"
import { Switch } from "@loomark/ui/components/switch"

import {
  ensureNamedFolder,
  hasBookmarksPermission,
  listFolders,
  requestBookmarksPermission,
  type NativeFolder,
} from "@/lib/bookmarks"
import { requestSync } from "@/lib/messages"
import {
  clearSyncLinks,
  readSyncSettings,
  readSyncStatus,
  watchSyncStatus,
  writeSyncSettings,
  type SyncSettings,
  type SyncStatus,
} from "@/lib/storage"

const NEW_FOLDER = "__new__"
const STALE_AFTER = 2 * 60 * 1000
const FOLDER_NAME = "Loomark"

const relative = (at: number, now: number) => {
  const minutes = Math.round((now - at) / 60000)

  if (minutes < 1) {
    return "just now"
  }

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.round(minutes / 60)

  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`
}

export const SyncPanel = ({ onClose }: { onClose: () => void }) => {
  const [settings, setSettings] = useState<SyncSettings | null>(null)
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [folders, setFolders] = useState<NativeFolder[]>([])
  const [granted, setGranted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(0)

  const loadFolders = useCallback(async () => {
    setFolders(await listFolders().catch(() => []))
  }, [])

  useEffect(() => {
    void (async () => {
      const [stored, current, permitted] = await Promise.all([
        readSyncSettings(),
        readSyncStatus(),
        hasBookmarksPermission(),
      ])

      setSettings(stored)
      setStatus(current)
      setGranted(permitted)
      setNow(Date.now())

      if (permitted) {
        await loadFolders()
      }
    })()
  }, [loadFolders])

  useEffect(() => watchSyncStatus(setStatus), [])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)

    return () => clearInterval(timer)
  }, [])

  const apply = async (next: SyncSettings, resetLinks: boolean) => {
    if (resetLinks) {
      await clearSyncLinks()
    }

    await writeSyncSettings(next)
    setSettings(next)

    if (next.enabled && next.rootId) {
      await requestSync()
    }
  }

  const toggle = async (enabled: boolean) => {
    if (!settings || busy) {
      return
    }

    setError(null)

    if (!enabled) {
      setBusy(true)
      await apply({ ...settings, enabled: false }, true)
      setBusy(false)
      return
    }

    const permitted = granted || (await requestBookmarksPermission())

    if (!permitted) {
      setError("Loomark needs access to your bookmarks to sync")
      return
    }

    setBusy(true)
    setGranted(true)
    await loadFolders()

    const rootId = settings.rootId ?? (await ensureNamedFolder(FOLDER_NAME))

    if (!rootId) {
      setError("Could not create a sync folder")
      setBusy(false)
      return
    }

    await apply({ enabled: true, rootId }, true)
    setBusy(false)
  }

  const pickFolder = async (value: string) => {
    if (!settings || busy) {
      return
    }

    setBusy(true)
    setError(null)

    const rootId =
      value === NEW_FOLDER ? await ensureNamedFolder(FOLDER_NAME) : value

    if (!rootId) {
      setError("Could not create a sync folder")
      setBusy(false)
      return
    }

    await loadFolders()
    await apply({ ...settings, rootId }, true)
    setBusy(false)
  }

  const known = folders.some((folder) => folder.id === settings?.rootId)
  const active =
    Boolean(status?.running) && now - (status?.startedAt ?? 0) < STALE_AFTER
  const running = busy || active

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="iconSm"
          aria-label="Back"
          onClick={onClose}
        >
          <ArrowLeftIcon />
        </Button>
        <h2 className="text-sm font-medium">Bookmark sync</h2>
      </div>

      <label className="flex items-start justify-between gap-3">
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Mirror this browser</span>
          <span className="text-xs text-muted-foreground">
            Loomark and your browser bookmarks stay in step every 3 minutes.
          </span>
        </span>
        <Switch
          checked={Boolean(settings?.enabled)}
          disabled={!settings || busy}
          onCheckedChange={(checked) => {
            void toggle(checked)
          }}
        />
      </label>

      {settings?.enabled ? (
        <>
          <Field label="Sync folder" htmlFor="sync-folder">
            <FieldSelect
              id="sync-folder"
              value={known ? (settings.rootId ?? NEW_FOLDER) : NEW_FOLDER}
              disabled={busy}
              onChange={(event) => {
                void pickFolder(event.target.value)
              }}
            >
              <option value={NEW_FOLDER}>{`${FOLDER_NAME} folder`}</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {`${"  ".repeat(folder.depth)}${folder.title}`}
                </option>
              ))}
            </FieldSelect>
          </Field>
          <p className="text-xs text-muted-foreground">
            Everything inside this folder mirrors your Loomark collections, both
            ways. Deleting on either side deletes on the other.
          </p>
        </>
      ) : null}

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {settings?.enabled ? (
        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            {status?.error ? (
              <span className="text-destructive">{status.error}</span>
            ) : status?.at ? (
              `Last synced ${relative(status.at, now)}`
            ) : (
              "Not synced yet"
            )}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={running}
            onClick={() => {
              void requestSync()
            }}
          >
            {running ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <RefreshCwIcon />
            )}
            Sync now
          </Button>
        </div>
      ) : null}
    </div>
  )
}
