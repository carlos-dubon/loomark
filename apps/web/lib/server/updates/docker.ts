import "server-only"

import { readFile, stat } from "node:fs/promises"
import { request } from "node:http"
import { connect } from "node:net"
import { hostname } from "node:os"
import { createInterface } from "node:readline"

export const SOCKET_PATH = process.env.DOCKER_SOCKET ?? "/var/run/docker.sock"

export type SocketState =
  | { ok: true }
  | { ok: false; reason: "MISSING" }
  | { ok: false; reason: "FORBIDDEN"; gid: number }
  | { ok: false; reason: "UNREACHABLE"; detail: string }

export type ContainerConfig = {
  Hostname?: string
  Image?: string
  Env?: string[]
  Cmd?: string[] | null
  Entrypoint?: string[] | null
  Labels?: Record<string, string>
  ExposedPorts?: Record<string, unknown>
  Volumes?: Record<string, unknown>
  WorkingDir?: string
  User?: string
}

export type EndpointSettings = {
  IPAMConfig?: unknown
  Links?: string[] | null
  Aliases?: string[] | null
  DriverOpts?: Record<string, string> | null
  NetworkID?: string
}

export type Mount = { Source?: string; Destination?: string }

export type Container = {
  Id: string
  Name: string
  Image: string
  Config: ContainerConfig
  HostConfig: Record<string, unknown>
  Mounts?: Mount[]
  NetworkSettings: { Networks?: Record<string, EndpointSettings> }
}

export type Image = {
  Id: string
  Config: ContainerConfig
  RepoDigests?: string[]
}

export class DockerError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "DockerError"
    this.status = status
  }
}

const dial = () =>
  new Promise<NodeJS.ErrnoException | null>((resolve) => {
    const socket = connect(SOCKET_PATH)
    const settle = (error: NodeJS.ErrnoException | null) => {
      socket.destroy()
      resolve(error)
    }

    socket.setTimeout(5000, () => settle(new Error("timed out")))
    socket.once("connect", () => settle(null))
    socket.once("error", settle)
  })

export const socketState = async (): Promise<SocketState> => {
  const info = await stat(SOCKET_PATH).catch(() => null)

  if (!info) {
    return { ok: false, reason: "MISSING" }
  }

  const error = await dial()

  if (error?.code === "EACCES" || error?.code === "EPERM") {
    return { ok: false, reason: "FORBIDDEN", gid: info.gid }
  }

  if (error) {
    return { ok: false, reason: "UNREACHABLE", detail: error.message }
  }

  return { ok: true }
}

type Options = {
  method?: string
  body?: unknown
  signal?: AbortSignal
}

const send = (path: string, options: Options = {}) =>
  new Promise<{ status: number; body: string }>((resolve, reject) => {
    const payload = options.body ? JSON.stringify(options.body) : null

    const call = request(
      {
        socketPath: SOCKET_PATH,
        path,
        method: options.method ?? "GET",
        signal: options.signal,
        headers: {
          host: "docker",
          ...(payload
            ? {
                "content-type": "application/json",
                "content-length": Buffer.byteLength(payload),
              }
            : {}),
        },
      },
      (response) => {
        const chunks: Buffer[] = []

        response.on("data", (chunk: Buffer) => chunks.push(chunk))
        response.on("end", () =>
          resolve({
            status: response.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          })
        )
      }
    )

    call.on("error", reject)

    if (payload) {
      call.write(payload)
    }

    call.end()
  })

const failure = (body: string, status: number) => {
  const parsed = (() => {
    try {
      return JSON.parse(body) as { message?: string }
    } catch {
      return null
    }
  })()

  return new DockerError(
    parsed?.message ?? (body.trim() || "Docker refused the request"),
    status
  )
}

export const dockerJson = async <T>(path: string, options: Options = {}) => {
  const { status, body } = await send(path, options)

  if (status < 200 || status >= 300) {
    throw failure(body, status)
  }

  return (body ? JSON.parse(body) : null) as T
}

export const dockerVoid = async (path: string, options: Options = {}) => {
  const { status, body } = await send(path, options)

  if (status < 200 || status >= 300) {
    throw failure(body, status)
  }
}

export type PullEvent = {
  status?: string
  id?: string
  error?: string
  progressDetail?: { current?: number; total?: number }
}

export const streamPull = (
  image: string,
  tag: string,
  onEvent: (event: PullEvent) => void,
  signal?: AbortSignal
) =>
  new Promise<void>((resolve, reject) => {
    const path = `/images/create?fromImage=${encodeURIComponent(image)}&tag=${encodeURIComponent(tag)}`

    const call = request(
      {
        socketPath: SOCKET_PATH,
        path,
        method: "POST",
        signal,
        headers: { host: "docker", "content-length": 0 },
      },
      (response) => {
        if ((response.statusCode ?? 0) >= 300) {
          const chunks: Buffer[] = []

          response.on("data", (chunk: Buffer) => chunks.push(chunk))
          response.on("end", () =>
            reject(
              failure(
                Buffer.concat(chunks).toString("utf8"),
                response.statusCode ?? 0
              )
            )
          )

          return
        }

        const lines = createInterface({ input: response })
        let failed: string | null = null

        lines.on("line", (line) => {
          if (!line.trim()) {
            return
          }

          try {
            const event = JSON.parse(line) as PullEvent

            if (event.error) {
              failed = event.error
            }

            onEvent(event)
          } catch {
            return
          }
        })

        lines.on("close", () =>
          failed ? reject(new Error(failed)) : resolve()
        )
      }
    )

    call.on("error", reject)
    call.end()
  })

export const inspectContainer = (id: string) =>
  dockerJson<Container>(`/containers/${encodeURIComponent(id)}/json`)

export const inspectImage = (ref: string) =>
  dockerJson<Image>(`/images/${encodeURIComponent(ref)}/json`)

const CONTAINER_ID = /\b[0-9a-f]{64}\b/

const idFromFile = async (path: string, marker: string) => {
  const text = await readFile(path, "utf8").catch(() => null)

  if (!text) {
    return null
  }

  for (const line of text.split("\n")) {
    if (!line.includes(marker)) {
      continue
    }

    const match = CONTAINER_ID.exec(line)

    if (match) {
      return match[0]
    }
  }

  return null
}

export const findSelf = async (): Promise<Container | null> => {
  const candidates = [
    hostname(),
    await idFromFile("/proc/self/mountinfo", "containers/"),
    await idFromFile("/proc/self/cgroup", "docker"),
  ]

  for (const candidate of candidates) {
    if (!candidate) {
      continue
    }

    const container = await inspectContainer(candidate).catch(() => null)

    if (container) {
      return container
    }
  }

  return null
}
