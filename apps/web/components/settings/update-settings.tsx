"use client"

import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { formatDate } from "@loomark/core/format"
import {
  SELF_UPDATE_MESSAGES,
  UPDATE_COMMAND,
  type ParkedUpdate,
  type UpdateStatus,
} from "@loomark/core/updates"
import { Alert, AlertDescription } from "@loomark/ui/components/alert"
import { Button } from "@loomark/ui/components/button"
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
} from "@loomark/ui/components/progress"

import { Link } from "@/components/link"
import { useUpdates } from "@/hooks/use-updates"

const COMPOSE_HINT = (gid: string) =>
  `Add group_add: ["${gid}"] to the app service so it can reach the socket.`

const Parked = ({
  parked,
  onDiscard,
}: {
  parked: ParkedUpdate[]
  onDiscard: () => Promise<void>
}) => {
  const [discarding, setDiscarding] = useState(false)

  if (parked.length === 0) {
    return null
  }

  const [newest] = parked

  const discard = async () => {
    setDiscarding(true)
    await onDiscard()
    setDiscarding(false)
  }

  return (
    <Alert variant="error">
      <AlertDescription className="flex flex-col gap-3">
        <span>
          An earlier update could not start and Loomark rolled back. The
          container it tried to launch on {formatDate(newest.createdAt)} is
          still here as{" "}
          <span className="font-mono text-foreground">{newest.name}</span>
          {parked.length > 1
            ? `, along with ${parked.length - 1} more.`
            : ", kept so you can inspect it."}
        </span>
        <div>
          <Button
            variant="destructive-outline"
            loading={discarding}
            onClick={() => void discard()}
          >
            <Trash2Icon aria-hidden="true" />
            {discarding ? "Removing…" : "Remove it"}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

const Blocked = ({ status }: { status: UpdateStatus }) => {
  const [copied, setCopied] = useState(false)
  const { selfUpdate } = status

  useEffect(() => {
    if (!copied) {
      return
    }

    const timer = setTimeout(() => setCopied(false), 2000)

    return () => clearTimeout(timer)
  }, [copied])

  if (selfUpdate.supported) {
    return null
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(UPDATE_COMMAND)
      setCopied(true)
    } catch {
      setCopied(false)
      toast.error("Could not reach the clipboard. Copy the command by hand.")
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="warning">
        <AlertDescription>
          {SELF_UPDATE_MESSAGES[selfUpdate.reason]}
          {selfUpdate.reason === "NO_SOCKET_ACCESS" && selfUpdate.detail
            ? ` ${COMPOSE_HINT(selfUpdate.detail)}`
            : null}
        </AlertDescription>
      </Alert>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => void copy()}>
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? "Copied" : "Copy update command"}
        </Button>
        <code className="truncate font-mono text-xs text-muted-foreground">
          {UPDATE_COMMAND}
        </code>
      </div>
    </div>
  )
}

export const UpdateSettings = () => {
  const { status, job, running, install, refresh, discardParked } = useUpdates()
  const [checking, setChecking] = useState(false)
  const [installing, setInstalling] = useState(false)

  if (!status) {
    return (
      <span className="text-sm text-muted-foreground">
        Checking for updates…
      </span>
    )
  }

  const check = async () => {
    setChecking(true)
    await refresh({ force: true })
    setChecking(false)
  }

  const startInstall = async () => {
    setInstalling(true)
    try {
      await install()
    } finally {
      setInstalling(false)
    }
  }

  if (running) {
    return (
      <Progress value={job.progress} className="gap-1.5">
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
        <ProgressLabel className="truncate">
          {job.message || "Updating"}
        </ProgressLabel>
      </Progress>
    )
  }

  if (!status.available || !status.latest) {
    return (
      <div className="flex flex-col gap-4">
        <Parked parked={status.parked} onDiscard={discardParked} />
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            loading={checking}
            onClick={() => void check()}
          >
            <RefreshCwIcon aria-hidden="true" />
            {checking ? "Checking…" : "Check for updates"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {job.error ?? "You are on the newest release."}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed px-3 py-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium">
            {status.latest.version} is out
          </span>
          <span className="text-xs text-muted-foreground">
            Released {formatDate(status.latest.publishedAt)} ·{" "}
            <Link
              className="underline underline-offset-4 hover:text-foreground"
              href={status.latest.url}
            >
              Release notes
            </Link>
          </span>
        </div>
        {status.selfUpdate.supported ? (
          <Button loading={installing} onClick={() => void startInstall()}>
            <DownloadIcon aria-hidden="true" />
            {installing ? "Starting…" : "Update now"}
          </Button>
        ) : null}
      </div>
      {job.error ? (
        <Alert variant="error">
          <AlertDescription>{job.error}</AlertDescription>
        </Alert>
      ) : null}
      <Parked parked={status.parked} onDiscard={discardParked} />
      <Blocked status={status} />
    </div>
  )
}
