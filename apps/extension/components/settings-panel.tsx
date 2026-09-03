import { ArrowLeftIcon, Loader2Icon, RefreshCwIcon } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@loomark/ui/components/button"
import { Field, FieldSelect } from "@loomark/ui/components/field"
import { Switch } from "@loomark/ui/components/switch"

import { useSyncStatus } from "@/hooks/use-sync-status"
import {
  defaultRootId,
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
  watchSyncSettings,
  writeSyncSettings,
  type SyncSettings,
} from "@/lib/storage"

const NEW_FOLDER = "__new__"
const FOLDER_NAME = "Loomark"
const DENIED = "Loomark needs access to your bookmarks to sync"

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

const Section = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <section className="flex flex-col gap-3">
    <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {title}
    </h3>
    {children}
  </section>
)

export const SettingsPanel = ({ onClose }: { onClose: () => void }) => {
  const [settings, setSettings] = useState<SyncSettings | null>(null)
  const [folders, setFolders] = useState<NativeFolder[]>([])
  const [granted, setGranted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { status, now, syncing } = useSyncStatus()

  const loadFolders = useCallback(async () => {
    setFolders(await listFolders().catch(() => []))
  }, [])

  useEffect(() => {
    void (async () => {
      const [stored, permitted] = await Promise.all([
        readSyncSettings(),
        hasBookmarksPermission(),
      ])

      setGranted(permitted)

      if (permitted) {
        setSettings(stored)
        await loadFolders()
        return
      }

      if (stored.enabled) {
        await writeSyncSettings({ ...stored, enabled: false })
        setError(DENIED)
      }

      setSettings({ ...stored, enabled: false })
    })()
  }, [loadFolders])

  useEffect(() => watchSyncSettings(setSettings), [])

  const toggle = async (enabled: boolean) => {
    if (!settings || busy) {
      return
    }

    setError(null)

    if (!enabled) {
      setBusy(true)
      await clearSyncLinks()
      await writeSyncSettings({ ...settings, enabled: false })
      setSettings({ ...settings, enabled: false })
      setBusy(false)
      return
    }

    void clearSyncLinks()
    void writeSyncSettings({ ...settings, enabled: true })
    setSettings({ ...settings, enabled: true })

    const permitted = granted || (await requestBookmarksPermission())

    if (!permitted) {
      await writeSyncSettings({ ...settings, enabled: false })
      setSettings({ ...settings, enabled: false })
      setError(DENIED)
      return
    }

    setGranted(true)
    setBusy(true)
    await loadFolders()

    const current = await readSyncSettings()
    const rootId = current.rootId ?? (await defaultRootId())
    const next = rootId ? { ...current, rootId } : current

    if (rootId && rootId !== current.rootId) {
      await writeSyncSettings(next)
    }

    setSettings(next)
    await requestSync()
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

    await clearSyncLinks()
    await writeSyncSettings({ ...settings, rootId })
    setSettings({ ...settings, rootId })
    await loadFolders()
    await requestSync()
    setBusy(false)
  }

  const known = folders.some((folder) => folder.id === settings?.rootId)
  const busyish = busy || syncing

  return (
    <div className="flex flex-col gap-4 p-3">
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
        <h2 className="text-sm font-medium">Settings</h2>
      </div>

      <Section title="Bookmark sync">
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
                value={known ? (settings.rootId ?? "") : ""}
                disabled={busyish}
                onChange={(event) => {
                  void pickFolder(event.target.value)
                }}
              >
                {known ? null : <option value="">Choosing…</option>}
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {`${"  ".repeat(folder.depth)}${folder.title}`}
                  </option>
                ))}
                <option
                  value={NEW_FOLDER}
                >{`New ${FOLDER_NAME} folder`}</option>
              </FieldSelect>
            </Field>
            <p className="text-xs text-muted-foreground">
              Everything inside this folder mirrors your Loomark collections,
              both ways. Deleting on either side deletes on the other.
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
            <p className="flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground">
              {syncing ? (
                <>
                  <Loader2Icon className="size-3.5 shrink-0 animate-spin" />
                  Syncing…
                </>
              ) : status?.error ? (
                <span className="truncate text-destructive">
                  {status.error}
                </span>
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
              disabled={busyish}
              onClick={() => {
                void requestSync()
              }}
            >
              {busyish ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <RefreshCwIcon />
              )}
              Sync now
            </Button>
          </div>
        ) : null}
      </Section>
    </div>
  )
}
