import {
  SOCKET_PATH,
  type Container,
  type EndpointSettings,
  type Image,
} from "@/lib/updates/docker"

const withoutImageDefaults = (values: string[], defaults: string[]) => {
  const known = new Set(defaults)

  return values.filter((value) => !known.has(value))
}

const sameList = (
  a: string[] | null | undefined,
  b: string[] | null | undefined
) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

export const endpoint = (
  { IPAMConfig, Links, Aliases, DriverOpts }: EndpointSettings,
  selfId: string
) => ({
  IPAMConfig,
  Links,
  Aliases: (Aliases ?? []).filter((alias) => !selfId.startsWith(alias)),
  DriverOpts,
})

export const successorBody = (
  self: Container,
  target: string,
  current: Image
) => {
  const labels = Object.fromEntries(
    Object.entries(self.Config.Labels ?? {}).filter(
      ([key, value]) => (current.Config.Labels ?? {})[key] !== value
    )
  )
  const networks = Object.entries(self.NetworkSettings.Networks ?? {})
  const [first] = networks

  return {
    body: {
      ...self.Config,
      Hostname: "",
      Image: target,
      Env: withoutImageDefaults(
        self.Config.Env ?? [],
        current.Config.Env ?? []
      ),
      Cmd: sameList(self.Config.Cmd, current.Config.Cmd)
        ? null
        : self.Config.Cmd,
      Entrypoint: sameList(self.Config.Entrypoint, current.Config.Entrypoint)
        ? null
        : self.Config.Entrypoint,
      Labels: labels,
      HostConfig: self.HostConfig,
      NetworkingConfig: first
        ? { EndpointsConfig: { [first[0]]: endpoint(first[1], self.Id) } }
        : undefined,
    },
    extraNetworks: networks.slice(1),
  }
}

const socketSource = (self: Container) =>
  self.Mounts?.find((mount) => mount.Destination === SOCKET_PATH)?.Source ??
  SOCKET_PATH

export const helperBody = (
  self: Container,
  successor: string,
  name: string,
  parked: string
) => ({
  Image: self.Image,
  Entrypoint: ["node"],
  Cmd: ["/app/docker/self-update.mjs"],
  User: "0:0",
  Env: [
    `LOOMARK_OLD=${self.Id}`,
    `LOOMARK_NEW=${successor}`,
    `LOOMARK_NAME=${name}`,
    `LOOMARK_FAILED=${parked}`,
    `DOCKER_SOCKET=${SOCKET_PATH}`,
  ],
  HostConfig: {
    AutoRemove: true,
    NetworkMode: "none",
    Binds: [`${socketSource(self)}:${SOCKET_PATH}`],
    RestartPolicy: { Name: "no" },
  },
})
