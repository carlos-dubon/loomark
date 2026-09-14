import { RefreshCwIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@loomark/ui/components/button"
import { Field, SwitchField } from "@loomark/ui/components/field"
import { Spinner } from "@loomark/ui/components/spinner"

import { PanelHeader } from "@/components/panel-header"
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
      <PanelHeader title="Settings" onBack={onClose} />

      <Section title="Bookmark sync">
        <Field error={error ?? undefined}>
          <SwitchField
            id="sync-enabled"
            label="Mirror the bookmarks bar"
            checked={Boolean(settings?.enabled)}
            disabled={!settings || busy}
            onCheckedChange={(checked) => {
              void toggle(checked)
            }}
          />
        </Field>

        {settings?.enabled ? (
          <div className="flex items-center justify-between gap-2 border-t pt-3">
            <p className="flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground">
              {syncing ? (
                <>
                  <Spinner aria-hidden="true" className="size-3.5 shrink-0" />
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
              loading={busyish}
              onClick={() => {
                void requestSync()
              }}
            >
              <RefreshCwIcon aria-hidden="true" />
              {busyish ? "Syncing…" : "Sync now"}
            </Button>
          </div>
        ) : null}
      </Section>
    </div>
  )
}
