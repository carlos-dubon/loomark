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
  RELEASES_URL,
  SELF_UPDATE_MESSAGES,
  UPDATE_COMMAND,
  UPDATE_PHASE_MESSAGES,
  type ParkedUpdate,
  type UpdateJob,
  type UpdateStatus,
} from "@loomark/core/updates"
import { Alert, AlertDescription } from "@loomark/ui/components/alert"
import { Button } from "@loomark/ui/components/button"
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@loomark/ui/components/progress"

import { Link } from "@/components/link"
import { useUpdates } from "@/hooks/use-updates"

const COMPOSE_HINT = (gid: string) =>
  `Add group_add: ["${gid}"] to the app service so it can reach the socket.`

export const VersionRow = ({
  version,
  summary,
  children,
}: {
  version: string
  summary?: string
  children?: React.ReactNode
}) => (
  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-sm font-medium">
        Loomark <span className="font-mono">{version}</span>
      </span>
      {summary ? (
        <span className="text-xs text-muted-foreground">{summary}</span>
      ) : null}
    </div>
    {children ? (
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    ) : null}
  </div>
)

export const ReleaseNotesButton = ({ href }: { href: string }) => (
  <Button variant="ghost" render={<Link href={href} />}>
    Release notes
  </Button>
)

const UpdateProgress = ({
  job,
  value,
}: {
  job: UpdateJob
  value: number | null
}) => (
  <Progress value={value} className="gap-2">
    <div className="flex items-center justify-between gap-3">
      <ProgressLabel className="truncate">
        {job.message || UPDATE_PHASE_MESSAGES[job.phase]}
      </ProgressLabel>
      <ProgressValue />
    </div>
    <ProgressTrack className="h-1.5">
      <ProgressIndicator />
    </ProgressTrack>
  </Progress>
)

const Parked = ({
  parked,
  discarding,
  onDiscard,
}: {
  parked: ParkedUpdate[]
  discarding: boolean
  onDiscard: () => void
}) => {
  if (parked.length === 0) {
    return null
  }

  const [newest] = parked

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
            onClick={onDiscard}
          >
            <Trash2Icon aria-hidden="true" />
            Remove it
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

export const UpdateSettings = ({ version }: { version: string }) => {
  const {
    status,
    job,
    running,
    install,
    installing,
    check,
    checking,
    discardParked,
    discarding,
  } = useUpdates()

  if (!status) {
    return <VersionRow version={version} summary="Checking for updates…" />
  }

  const latest = status.available ? status.latest : null
  const updating = running || installing
  const summary = updating
    ? `Updating${latest ? ` to ${latest.version}` : ""}. Loomark will reload on its own.`
    : latest
      ? `${latest.version} is available, released ${formatDate(latest.publishedAt)}.`
      : "You are on the newest release."

  return (
    <div className="flex flex-col gap-4">
      <VersionRow version={version} summary={summary}>
        <ReleaseNotesButton href={latest?.url ?? RELEASES_URL} />
        {latest && status.selfUpdate.supported ? (
          <Button loading={updating} onClick={install}>
            <DownloadIcon aria-hidden="true" />
            Update now
          </Button>
        ) : (
          <Button variant="outline" loading={checking} onClick={check}>
            <RefreshCwIcon aria-hidden="true" />
            Check for updates
          </Button>
        )}
      </VersionRow>
      {running ? (
        <UpdateProgress
          job={job}
          value={
            job.phase === "PULLING" && job.progress > 0 ? job.progress : null
          }
        />
      ) : null}
      {job.error ? (
        <Alert variant="error">
          <AlertDescription>{job.error}</AlertDescription>
        </Alert>
      ) : null}
      <Parked
        parked={status.parked}
        discarding={discarding}
        onDiscard={discardParked}
      />
      {latest ? <Blocked status={status} /> : null}
    </div>
  )
}
