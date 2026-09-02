"use client"

import { useAtom, useAtomValue, useSetAtom } from "jotai"
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  Loader2Icon,
  RefreshCwIcon,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { sharePath } from "@loomark/core/routes"
import { Button } from "@loomark/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@loomark/ui/components/dialog"
import { Input } from "@loomark/ui/components/input"
import { Label } from "@loomark/ui/components/label"
import { Switch } from "@loomark/ui/components/switch"

import { api } from "@/lib/client-api"
import {
  collectionShareDialogAtom,
  collectionsAtom,
  setCollectionShareAtom,
} from "@/store/atoms"

const ShareLink = ({ token }: { token: string }) => {
  const [copied, setCopied] = useState(false)
  const path = sharePath(token)
  const url =
    typeof window === "undefined" ? path : `${window.location.origin}${path}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy the link")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        readOnly
        value={url}
        aria-label="Share link"
        onFocus={(event) => event.currentTarget.select()}
        className="font-mono text-xs"
      />
      <Button
        variant="outline"
        size="icon"
        aria-label="Copy share link"
        onClick={copy}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Open share link"
        render={<a href={url} target="_blank" rel="noopener noreferrer" />}
      >
        <ExternalLinkIcon />
      </Button>
    </div>
  )
}

export const CollectionShareDialog = () => {
  const [target, setTarget] = useAtom(collectionShareDialogAtom)
  const collections = useAtomValue(collectionsAtom)
  const setShare = useSetAtom(setCollectionShareAtom)
  const [pending, setPending] = useState(false)

  const collection = target
    ? (collections.find((item) => item.id === target.id) ?? target)
    : null

  const run = async (id: string, shared: boolean, message: string) => {
    setPending(true)

    try {
      const { shareToken } = shared
        ? await api.shareCollection(id)
        : await api.unshareCollection(id)

      setShare(id, shareToken)
      toast.success(message)
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Sharing failed")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={collection !== null}
      onOpenChange={(open) => {
        if (!open && !pending) {
          setTarget(null)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share “{collection?.name}”</DialogTitle>
          <DialogDescription>
            Anyone with the link can read this collection and everything nested
            inside it. They cannot change anything, and they never see the rest
            of your library.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div className="flex flex-col">
              <Label htmlFor="collection-shared">Share with a link</Label>
              <span className="text-xs text-muted-foreground">
                Turn it off to revoke the link.
              </span>
            </div>
            <Switch
              id="collection-shared"
              checked={Boolean(collection?.shareToken)}
              disabled={pending || !collection}
              onCheckedChange={(shared) => {
                if (!collection) {
                  return
                }

                void run(
                  collection.id,
                  shared,
                  shared ? "Share link created" : "Sharing turned off"
                )
              }}
            />
          </div>
          {collection?.shareToken ? (
            <div className="flex flex-col gap-2">
              <ShareLink token={collection.shareToken} />
              <Button
                variant="ghost"
                size="sm"
                className="self-start"
                disabled={pending}
                onClick={() =>
                  void run(collection.id, true, "New share link created")
                }
              >
                {pending ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <RefreshCwIcon />
                )}
                Regenerate link
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
