import { errorMessage } from "@loomark/core/format"
import {
  IDLE_UPDATE_JOB,
  isUpdateRunning,
  parseVersion,
  type ParkedUpdate,
  type SelfUpdate,
  type UpdateJob,
} from "@loomark/core/updates"

import { isDemo } from "@/lib/demo/config"
import {
  findSelf,
  inspectImage,
  dockerJson,
  dockerVoid,
  socketState,
  streamPull,
  SOCKET_PATH,
  type Container,
} from "@/lib/server/updates/docker"
import {
  endpoint,
  helperBody,
  successorBody,
} from "@/lib/server/updates/successor"

export const appVersion = process.env.APP_VERSION ?? "dev"

const selfUpdateEnabled = process.env.LOOMARK_SELF_UPDATE !== "false"

export type ImageRef = {
  repo: string
  tag: string | null
  digest: string | null
}

export const parseImageRef = (ref: string): ImageRef => {
  const [withoutDigest, digest] = ref.split("@")
  const separator = withoutDigest.lastIndexOf(":")
  const slash = withoutDigest.lastIndexOf("/")

  if (separator > slash) {
    return {
      repo: withoutDigest.slice(0, separator),
      tag: withoutDigest.slice(separator + 1),
      digest: digest ?? null,
    }
  }

  return { repo: withoutDigest, tag: null, digest: digest ?? null }
}

const isFloating = (ref: ImageRef) =>
  ref.digest === null && (ref.tag === null || ref.tag === "latest")

let job: UpdateJob = IDLE_UPDATE_JOB

export const updateJob = () => job

const setJob = (patch: Partial<UpdateJob>) => {
  job = { ...job, ...patch }
}

const PARKED_SUFFIX = "-failed-"

type ContainerSummary = { Id: string; Names?: string[]; Created?: number }

const listParked = async () => {
  const socket = await socketState()

  if (!socket.ok) {
    return []
  }

  const self = await findSelf()

  if (!self) {
    return []
  }

  const prefix = `${self.Name.replace(/^\//, "")}${PARKED_SUFFIX}`
  const filters = encodeURIComponent(
    JSON.stringify({ name: [prefix], status: ["created", "exited", "dead"] })
  )
  const found = await dockerJson<ContainerSummary[]>(
    `/containers/json?all=true&filters=${filters}`
  ).catch(() => [])

  return found.flatMap((container) => {
    const name = container.Names?.[0]?.replace(/^\//, "") ?? ""

    return name.startsWith(prefix) ? [{ container, name }] : []
  })
}

export const parkedUpdates = async (): Promise<ParkedUpdate[]> =>
  (await listParked())
    .map(({ container, name }) => ({
      name,
      createdAt: new Date((container.Created ?? 0) * 1000).toISOString(),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

export const discardParkedUpdates = async () => {
  const parked = await listParked()

  for (const { container } of parked) {
    await dockerVoid(`/containers/${container.Id}?force=true`, {
      method: "DELETE",
    }).catch(() => undefined)
  }

  return parked.length
}

export const selfUpdateSupport = async (): Promise<SelfUpdate> => {
  if (isDemo) {
    return { supported: false, reason: "DEMO", detail: null }
  }

  if (parseVersion(appVersion) === null) {
    return { supported: false, reason: "UNKNOWN_VERSION", detail: appVersion }
  }

  if (!selfUpdateEnabled) {
    return { supported: false, reason: "DISABLED", detail: null }
  }

  const socket = await socketState()

  if (!socket.ok) {
    if (socket.reason === "MISSING") {
      return { supported: false, reason: "NO_SOCKET", detail: SOCKET_PATH }
    }

    return socket.reason === "FORBIDDEN"
      ? {
          supported: false,
          reason: "NO_SOCKET_ACCESS",
          detail: String(socket.gid),
        }
      : {
          supported: false,
          reason: "SOCKET_UNREACHABLE",
          detail: socket.detail,
        }
  }

  const self = await findSelf()

  if (!self) {
    return { supported: false, reason: "NOT_CONTAINERIZED", detail: null }
  }

  const ref = parseImageRef(self.Config.Image ?? self.Image)

  if (!isFloating(ref)) {
    return {
      supported: false,
      reason: "PINNED",
      detail: ref.digest
        ? `${ref.repo}@${ref.digest}`
        : `${ref.repo}:${ref.tag}`,
    }
  }

  return { supported: true }
}

type Layer = { current: number; total: number }

const pullProgress = (layers: Map<string, Layer>) => {
  let current = 0
  let total = 0

  for (const layer of layers.values()) {
    if (layer.total > 0) {
      current += Math.min(layer.current, layer.total)
      total += layer.total
    }
  }

  return total === 0 ? 0 : Math.round((current / total) * 85)
}

const STALE_IMAGE =
  "Loomark cannot inspect the image it is running, so it cannot safely rebuild its container. Update with docker compose pull && docker compose up -d."

const run = async (self: Container, target: string) => {
  const current = await inspectImage(self.Image).catch(() => null)

  if (!current) {
    throw new Error(STALE_IMAGE)
  }

  const ref = parseImageRef(target)
  const layers = new Map<string, Layer>()

  setJob({ phase: "PULLING", progress: 0, message: "Pulling the new image" })

  await streamPull(ref.repo, ref.tag ?? "latest", (event) => {
    if (event.id && event.progressDetail?.total) {
      layers.set(event.id, {
        current: event.progressDetail.current ?? 0,
        total: event.progressDetail.total,
      })
    }

    setJob({
      progress: pullProgress(layers),
      message: event.status ?? "Pulling the new image",
    })
  })

  const pulled = await inspectImage(target)

  if (pulled.Id === self.Image) {
    setJob({
      ...IDLE_UPDATE_JOB,
      message: "Already running the newest image",
    })

    return
  }

  setJob({
    phase: "SWAPPING",
    progress: 88,
    message: "Preparing the new container",
  })

  const name = self.Name.replace(/^\//, "")
  const { body, extraNetworks } = successorBody(self, target, current)
  const successor = await dockerJson<{ Id: string }>(
    `/containers/create?name=${encodeURIComponent(`${name}-update-${Date.now()}`)}`,
    { method: "POST", body }
  )

  const parked = `${name}-failed-${Date.now()}`
  let helper: { Id: string }

  try {
    for (const [network, settings] of extraNetworks) {
      await dockerVoid(`/networks/${encodeURIComponent(network)}/connect`, {
        method: "POST",
        body: {
          Container: successor.Id,
          EndpointConfig: endpoint(settings, self.Id),
        },
      })
    }

    helper = await dockerJson<{ Id: string }>(
      `/containers/create?name=${encodeURIComponent(`${name}-updater-${Date.now()}`)}`,
      { method: "POST", body: helperBody(self, successor.Id, name, parked) }
    )
  } catch (cause) {
    await dockerVoid(`/containers/${successor.Id}?force=true`, {
      method: "DELETE",
    }).catch(() => undefined)

    throw cause
  }

  setJob({
    phase: "RESTARTING",
    progress: 95,
    message: "Restarting into the new version",
    parked,
  })

  await dockerVoid(`/containers/${helper.Id}/start`, { method: "POST" })
}

export const startSelfUpdate = async () => {
  if (isUpdateRunning(job)) {
    return job
  }

  const support = await selfUpdateSupport()

  if (!support.supported) {
    throw new Error(support.reason)
  }

  const self = await findSelf()

  if (!self) {
    throw new Error("NOT_CONTAINERIZED")
  }

  const ref = parseImageRef(self.Config.Image ?? self.Image)
  const target = `${ref.repo}:${ref.tag ?? "latest"}`

  job = { ...IDLE_UPDATE_JOB, phase: "PULLING", target }

  void run(self, target).catch((cause: unknown) => {
    setJob({
      phase: "FAILED",
      error: errorMessage(cause, "The update failed"),
    })
  })

  return job
}
