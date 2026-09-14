import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CheckIcon,
  ExternalLinkIcon,
  LogOutIcon,
  SettingsIcon,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { errorMessage } from "@loomark/core/format"
import { unsortedCollection } from "@loomark/core/tree"
import type { ActiveTab, CollectionDTO, Connection } from "@loomark/core/types"
import { hostFromUrl } from "@loomark/core/url"
import { Button } from "@loomark/ui/components/button"
import { CollectionIcon } from "@loomark/ui/components/collection-icon"
import { Favicon } from "@loomark/ui/components/favicon"
import { Spinner } from "@loomark/ui/components/spinner"

import { BookmarkForm } from "@/components/bookmark-form"
import { CollectionForm } from "@/components/collection-form"
import { useSyncStatus } from "@/hooks/use-sync-status"
import { SettingsPanel } from "@/components/settings-panel"
import { SetupForm } from "@/components/setup-form"
import { disconnect, isOffline, isUnauthorized, type Auth } from "@/lib/api"
import { requestHostPermission } from "@/lib/permissions"
import {
  bookmarkLookupQuery,
  collectionsQuery,
  lastCollectionIdQuery,
} from "@/lib/queries"
import { clearConnection, readConnection, writeConnection } from "@/lib/storage"
import { readActiveTab } from "@/lib/tabs"

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="flex w-[380px] flex-col">{children}</div>
)

const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center">
    {children}
  </div>
)

const Header = ({ tab }: { tab: ActiveTab }) => (
  <header className="flex items-center gap-2.5 border-b p-3">
    <Favicon src={tab.faviconUrl} className="size-5 shrink-0 rounded-sm" />
    <div className="flex min-w-0 flex-col">
      <p className="truncate text-sm font-medium">
        {tab.title || hostFromUrl(tab.url)}
      </p>
      <p className="truncate text-xs text-muted-foreground">
        {hostFromUrl(tab.url)}
      </p>
    </div>
  </header>
)

const StatusBar = ({
  connection,
  collection,
  saved,
  onDisconnect,
  onOpenSettings,
}: {
  connection: Connection
  collection: CollectionDTO | null
  saved: boolean
  onDisconnect: () => void
  onOpenSettings: () => void
}) => {
  const { syncing } = useSyncStatus()

  return (
    <footer className="flex items-center justify-between gap-2 border-t px-3 py-2">
      <Button
        type="button"
        variant="ghost-muted"
        size="compact"
        onClick={onDisconnect}
        title="Disconnect this browser"
        className="-ml-2 min-w-0 shrink"
      >
        <LogOutIcon />
        <span className="truncate">{connection.user.email}</span>
      </Button>
      {saved ? (
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-success">
          <CheckIcon className="size-4" />
          <span className="flex items-center gap-1">
            Saved in
            {collection ? (
              <>
                <CollectionIcon name={collection.icon} className="size-3.5" />
                <span className="max-w-28 truncate">{collection.name}</span>
              </>
            ) : (
              "Loomark"
            )}
          </span>
        </span>
      ) : (
        <span className="shrink-0 text-xs text-muted-foreground">
          Not saved yet
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={syncing ? "Syncing" : "Settings"}
        title={syncing ? "Syncing…" : "Settings"}
        onClick={onOpenSettings}
      >
        {syncing ? (
          <Spinner aria-hidden="true" className="text-muted-foreground" />
        ) : (
          <SettingsIcon className="text-muted-foreground" />
        )}
      </Button>
    </footer>
  )
}

const Workspace = ({
  connection,
  tab,
  onDisconnect,
  onExpired,
}: {
  connection: Connection
  tab: ActiveTab
  onDisconnect: () => void
  onExpired: () => void
}) => {
  const auth: Auth = {
    serverUrl: connection.serverUrl,
    token: connection.token,
  }

  const queryClient = useQueryClient()
  const collectionsOptions = collectionsQuery(auth)
  const lookupOptions = bookmarkLookupQuery(auth, tab.url)

  const collectionsResult = useQuery(collectionsOptions)
  const lookupResult = useQuery(lookupOptions)
  const lastIdResult = useQuery(lastCollectionIdQuery)

  const { mutate: revoke } = useMutation({
    mutationFn: () => disconnect(auth),
  })

  const [preferredCollectionId, setPreferredCollectionId] = useState<
    string | null
  >(null)
  const [pendingCollectionId, setPendingCollectionId] = useState<string | null>(
    null
  )
  const [creating, setCreating] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const clearPendingCollection = useCallback(() => {
    setPendingCollectionId(null)
  }, [])

  const cause = collectionsResult.error ?? lookupResult.error
  const expired = isUnauthorized(cause)
  const fetching = collectionsResult.isFetching || lookupResult.isFetching

  useEffect(() => {
    if (expired) {
      onExpired()
    }
  }, [expired, onExpired])

  const retry = () => {
    void collectionsResult.refetch()
    void lookupResult.refetch()
  }

  const collections = collectionsResult.data ?? null
  const bookmark = lookupResult.data ?? null
  const loaded = collections && lookupResult.isSuccess && lastIdResult.isSuccess

  const lastId = lastIdResult.data
  const remembered =
    lastId && collections?.some((item) => item.id === lastId) ? lastId : null
  const fallback = collections
    ? (unsortedCollection(collections)?.id ?? collections[0]?.id ?? "")
    : ""
  const defaultCollectionId =
    preferredCollectionId ?? bookmark?.collectionId ?? remembered ?? fallback

  const savedIn =
    collections?.find((item) => item.id === bookmark?.collectionId) ?? null

  const body = () => {
    if (cause && !expired && !fetching) {
      return (
        <Centered>
          <p className="text-sm text-muted-foreground">
            {errorMessage(cause, "Could not reach Loomark")}
          </p>
          <div className="flex gap-2">
            {isOffline(cause) ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void requestHostPermission(connection.serverUrl).then(retry)
                }}
              >
                Grant access
              </Button>
            ) : null}
            <Button size="sm" onClick={retry}>
              Try again
            </Button>
          </div>
        </Centered>
      )
    }

    if (!loaded) {
      return (
        <Centered>
          <Spinner className="size-5 text-muted-foreground" />
        </Centered>
      )
    }

    return (
      <>
        <div className={creating ? "hidden" : undefined}>
          <BookmarkForm
            key={bookmark?.id ?? "new"}
            auth={auth}
            tab={tab}
            bookmark={bookmark}
            collections={collections}
            defaultCollectionId={defaultCollectionId}
            pendingCollectionId={pendingCollectionId}
            onCollectionApplied={clearPendingCollection}
            onSaved={(saved) => {
              queryClient.setQueryData(lookupOptions.queryKey, saved)
              setPreferredCollectionId(saved.collectionId)
            }}
            onRemoved={() => {
              setPreferredCollectionId(
                (current) => current ?? bookmark?.collectionId ?? null
              )
              queryClient.setQueryData(lookupOptions.queryKey, null)
            }}
            onNewCollection={() => setCreating(true)}
          />
        </div>
        {creating ? (
          <CollectionForm
            auth={auth}
            collections={collections}
            defaultParentId={null}
            onCancel={() => setCreating(false)}
            onCreated={(collection) => {
              queryClient.setQueryData(collectionsOptions.queryKey, [
                ...collections,
                collection,
              ])
              setPreferredCollectionId(collection.id)
              setPendingCollectionId(collection.id)
              setCreating(false)
            }}
          />
        ) : null}
      </>
    )
  }

  if (showSettings) {
    return (
      <Shell>
        <SettingsPanel onClose={() => setShowSettings(false)} />
      </Shell>
    )
  }

  return (
    <Shell>
      <Header tab={tab} />
      {body()}
      <StatusBar
        connection={connection}
        collection={savedIn}
        saved={Boolean(bookmark)}
        onOpenSettings={() => setShowSettings(true)}
        onDisconnect={() => {
          revoke()
          onDisconnect()
        }}
      />
    </Shell>
  )
}

export const App = () => {
  const queryClient = useQueryClient()
  const [connection, setConnection] = useState<Connection | null>(null)
  const [tab, setTab] = useState<ActiveTab | null>(null)
  const [booted, setBooted] = useState(false)

  useEffect(() => {
    void Promise.all([readConnection(), readActiveTab()]).then(
      ([stored, active]) => {
        setConnection(stored)
        setTab(active)
        setBooted(true)
      }
    )
  }, [])

  if (!booted) {
    return (
      <Shell>
        <Centered>
          <Spinner className="size-5 text-muted-foreground" />
        </Centered>
      </Shell>
    )
  }

  if (!connection) {
    return (
      <Shell>
        <SetupForm
          onConnected={(next) => {
            void writeConnection(next)
            setConnection(next)
          }}
        />
      </Shell>
    )
  }

  if (!tab) {
    return (
      <Shell>
        <Centered>
          <p className="text-sm font-medium">Nothing to save here</p>
          <p className="text-xs text-muted-foreground">
            Loomark can only save regular web pages.
          </p>
          <Button
            variant="link"
            size="compact"
            nativeButton={false}
            render={
              <a href={connection.serverUrl} target="_blank" rel="noreferrer" />
            }
          >
            Open Loomark
            <ExternalLinkIcon />
          </Button>
        </Centered>
      </Shell>
    )
  }

  const reset = () => {
    void clearConnection()
    queryClient.clear()
    setConnection(null)
  }

  return (
    <Workspace
      connection={connection}
      tab={tab}
      onDisconnect={reset}
      onExpired={reset}
    />
  )
}
