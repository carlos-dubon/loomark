import {
  CheckIcon,
  ExternalLinkIcon,
  GlobeIcon,
  Loader2Icon,
  LogOutIcon,
  RefreshCwIcon,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { unsortedCollection } from "@loomark/core/tree"
import type {
  ActiveTab,
  BookmarkDTO,
  CollectionDTO,
  Connection,
} from "@loomark/core/types"
import { hostFromUrl } from "@loomark/core/url"
import { Button } from "@loomark/ui/components/button"
import { CollectionIcon } from "@loomark/ui/components/collection-icon"

import { BookmarkForm } from "@/components/bookmark-form"
import { CollectionForm } from "@/components/collection-form"
import { SetupForm } from "@/components/setup-form"
import { SyncPanel } from "@/components/sync-panel"
import {
  disconnect,
  isOffline,
  isUnauthorized,
  listCollections,
  lookupBookmark,
  type Auth,
} from "@/lib/api"
import { requestHostPermission } from "@/lib/permissions"
import {
  clearConnection,
  readConnection,
  readLastCollectionId,
  writeConnection,
} from "@/lib/storage"
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
    {tab.faviconUrl ? (
      <img
        src={tab.faviconUrl}
        alt=""
        className="size-5 shrink-0 rounded-sm"
        onError={(event) => {
          event.currentTarget.style.visibility = "hidden"
        }}
      />
    ) : (
      <GlobeIcon className="size-5 shrink-0 text-muted-foreground" />
    )}
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
  onOpenSync,
}: {
  connection: Connection
  collection: CollectionDTO | null
  saved: boolean
  onDisconnect: () => void
  onOpenSync: () => void
}) => (
  <footer className="flex items-center justify-between gap-2 border-t px-3 py-2">
    <button
      type="button"
      onClick={onDisconnect}
      title="Disconnect this browser"
      className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <LogOutIcon className="size-3.5 shrink-0" />
      <span className="truncate">{connection.user.email}</span>
    </button>
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
      aria-label="Bookmark sync"
      title="Bookmark sync"
      onClick={onOpenSync}
    >
      <RefreshCwIcon className="text-muted-foreground" />
    </Button>
  </footer>
)

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

  const [collections, setCollections] = useState<CollectionDTO[] | null>(null)
  const [bookmark, setBookmark] = useState<BookmarkDTO | null>(null)
  const [defaultCollectionId, setDefaultCollectionId] = useState("")
  const [pendingCollectionId, setPendingCollectionId] = useState<string | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [creating, setCreating] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const clearPendingCollection = useCallback(() => {
    setPendingCollectionId(null)
  }, [])

  const load = useCallback(async () => {
    try {
      const [list, existing, lastId] = await Promise.all([
        listCollections(auth),
        lookupBookmark(auth, tab.url),
        readLastCollectionId(),
      ])

      const fallback = unsortedCollection(list)?.id ?? list[0]?.id ?? ""
      const remembered =
        lastId && list.some((item) => item.id === lastId) ? lastId : null

      setCollections(list)
      setBookmark(existing)
      setDefaultCollectionId(existing?.collectionId ?? remembered ?? fallback)
    } catch (cause) {
      if (isUnauthorized(cause)) {
        onExpired()
        return
      }

      setOffline(isOffline(cause))
      setError(
        cause instanceof Error ? cause.message : "Could not reach Loomark"
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection.serverUrl, connection.token, tab.url])

  useEffect(() => {
    // load() only touches state after awaiting network I/O, so this never
    // cascades renders synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const retry = useCallback(() => {
    setError(null)
    setOffline(false)
    void load()
  }, [load])

  const savedIn =
    collections?.find((item) => item.id === bookmark?.collectionId) ?? null

  const body = () => {
    if (error) {
      return (
        <Centered>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex gap-2">
            {offline ? (
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

    if (!collections) {
      return (
        <Centered>
          <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
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
              setBookmark(saved)
              setDefaultCollectionId(saved.collectionId)
            }}
            onRemoved={() => setBookmark(null)}
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
              setCollections([...collections, collection])
              setDefaultCollectionId(collection.id)
              setPendingCollectionId(collection.id)
              setCreating(false)
            }}
          />
        ) : null}
      </>
    )
  }

  if (syncing) {
    return (
      <Shell>
        <SyncPanel onClose={() => setSyncing(false)} />
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
        onOpenSync={() => setSyncing(true)}
        onDisconnect={() => {
          void disconnect(auth).catch(() => null)
          onDisconnect()
        }}
      />
    </Shell>
  )
}

export const App = () => {
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
          <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
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
          <a
            href={connection.serverUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-4"
          >
            Open Loomark
            <ExternalLinkIcon className="size-3.5" />
          </a>
        </Centered>
      </Shell>
    )
  }

  const reset = () => {
    void clearConnection()
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
