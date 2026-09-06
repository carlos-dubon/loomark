export const RELEASES_URL = "https://github.com/carlos-dubon/loomark/releases"

export type Release = {
  version: string
  url: string
  notes: string | null
  publishedAt: string
}

export const SELF_UPDATE_BLOCKERS = [
  "DEMO",
  "DISABLED",
  "NO_SOCKET",
  "NO_SOCKET_ACCESS",
  "SOCKET_UNREACHABLE",
  "NOT_CONTAINERIZED",
  "PINNED",
  "UNKNOWN_VERSION",
] as const

export type SelfUpdateBlocker = (typeof SELF_UPDATE_BLOCKERS)[number]

export type SelfUpdate =
  | { supported: true }
  | { supported: false; reason: SelfUpdateBlocker; detail: string | null }

export type ParkedUpdate = {
  name: string
  createdAt: string
}

export type UpdateStatus = {
  current: string
  latest: Release | null
  available: boolean
  selfUpdate: SelfUpdate
  parked: ParkedUpdate[]
}

export const UPDATE_PHASES = [
  "IDLE",
  "PULLING",
  "SWAPPING",
  "RESTARTING",
  "FAILED",
] as const

export type UpdatePhase = (typeof UPDATE_PHASES)[number]

export type UpdateJob = {
  phase: UpdatePhase
  progress: number
  message: string
  error: string | null
  target: string | null
  parked: string | null
}

export const IDLE_UPDATE_JOB: UpdateJob = {
  phase: "IDLE",
  progress: 0,
  message: "",
  error: null,
  target: null,
  parked: null,
}

export const isUpdateRunning = (job: UpdateJob) =>
  job.phase === "PULLING" ||
  job.phase === "SWAPPING" ||
  job.phase === "RESTARTING"

const RELEASE_TAG = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/

export const parseVersion = (value: string) => {
  const match = RELEASE_TAG.exec(value.trim())

  if (!match) {
    return null
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
  }
}

const comparePrerelease = (a: string | null, b: string | null) => {
  if (a === b) return 0
  if (a === null) return 1
  if (b === null) return -1

  return a < b ? -1 : 1
}

export const compareVersions = (a: string, b: string) => {
  const left = parseVersion(a)
  const right = parseVersion(b)

  if (!left || !right) {
    return 0
  }

  return (
    left.major - right.major ||
    left.minor - right.minor ||
    left.patch - right.patch ||
    comparePrerelease(left.prerelease, right.prerelease)
  )
}

export const isNewer = (candidate: string, current: string) =>
  parseVersion(candidate) !== null &&
  parseVersion(current) !== null &&
  compareVersions(candidate, current) > 0

export const SELF_UPDATE_MESSAGES: Record<SelfUpdateBlocker, string> = {
  DEMO: "Updating is turned off in the demo.",
  DISABLED:
    "One click updates are off. Set LOOMARK_SELF_UPDATE=true and mount the Docker socket to turn them on.",
  NO_SOCKET:
    "The Docker socket is not mounted, so Loomark cannot replace its own container.",
  NO_SOCKET_ACCESS:
    "The Docker socket is mounted but Loomark cannot read it. It needs to run as a member of the socket's group.",
  SOCKET_UNREACHABLE:
    "The Docker socket is mounted but the daemon did not answer.",
  NOT_CONTAINERIZED:
    "Loomark could not find its own container, so it cannot replace it.",
  PINNED:
    "This instance is pinned to a fixed image tag. A one click update would be undone the next time you run docker compose up.",
  UNKNOWN_VERSION:
    "This build does not report a release version, so there is nothing to compare against.",
}

export const UPDATE_COMMAND = "docker compose pull && docker compose up -d"
