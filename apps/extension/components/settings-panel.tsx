import { ArrowLeftIcon, Loader2Icon, RefreshCwIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@loomark/ui/components/button"
import { Switch } from "@loomark/ui/components/switch"

import { useSyncStatus } from "@/hooks/use-sync-status"
import {
  hasBookmarksPermission,
  requestBookmarksPermission,
} from "@/lib/bookmarks"
import { requestSync } from "@/lib/messages"
import {
  clearSyncLinks,
  readSyncSettings,
  watchSyncSettings,
  writeSyncSettings,
  type SyncSettings,
} from "@/lib/storage"

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
  const [granted, setGranted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { status, now, syncing } = useSyncStatus()

  useEffect(() => {
    void (async () => {
      const [stored, permitted] = await Promise.all([
        readSyncSettings(),
        hasBookmarksPermission(),
      ])

      setGranted(permitted)

      if (permitted) {
        setSettings(stored)
        return
      }

      if (stored.enabled) {
        await writeSyncSettings({ ...stored, enabled: false })
        setError(DENIED)
      }

      setSettings({ ...stored, enabled: false })
    })()
  }, [])

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
    await requestSync()
    setBusy(false)
  }

  const busyish = busy || syncing

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
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
            <span className="text-sm font-medium">
              Mirror the bookmarks bar
            </span>
            <span className="text-xs text-muted-foreground">
              Loomark and your bookmarks bar stay in step every 3 minutes.
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
          <p className="text-xs text-muted-foreground">
            Everything on your bookmarks bar mirrors your Loomark collections,
            both ways. Deleting on either side deletes on the other.
          </p>
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
