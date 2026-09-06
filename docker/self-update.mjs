import { request } from "node:http"

const socketPath = process.env.DOCKER_SOCKET ?? "/var/run/docker.sock"
const oldId = process.env.LOOMARK_OLD
const newId = process.env.LOOMARK_NEW
const name = process.env.LOOMARK_NAME
const parked = `${name}-old-${Date.now()}`
const failed = process.env.LOOMARK_FAILED ?? `${name}-failed-${Date.now()}`

const log = (message) => console.log(`loomark-updater: ${message}`)

const call = (path, method = "POST") =>
  new Promise((resolve, reject) => {
    const req = request(
      { socketPath, path, method, headers: { host: "docker", "content-length": 0 } },
      (response) => {
        const chunks = []

        response.on("data", (chunk) => chunks.push(chunk))
        response.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8")

          if (response.statusCode >= 300) {
            reject(new Error(`${method} ${path} -> ${response.statusCode} ${body}`))
            return
          }

          resolve(body)
        })
      }
    )

    req.on("error", reject)
    req.end()
  })

const rename = (id, to) => call(`/containers/${id}/rename?name=${encodeURIComponent(to)}`)

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const rollback = async () => {
  log("rolling back to the old container")

  await rename(newId, failed).catch(() => {})
  await rename(oldId, name).catch(() => {})
  await call(`/containers/${oldId}/start`).catch(() => {})
}

const main = async () => {
  if (!oldId || !newId || !name) {
    throw new Error("missing LOOMARK_OLD, LOOMARK_NEW or LOOMARK_NAME")
  }

  await wait(2000)

  log(`stopping ${name}`)
  await call(`/containers/${oldId}/stop?t=30`).catch((cause) => {
    if (!String(cause).includes("304")) {
      throw cause
    }
  })
  await call(`/containers/${oldId}/wait`)

  await rename(oldId, parked)

  try {
    await rename(newId, name)
    log(`starting ${name} on the new image`)
    await call(`/containers/${newId}/start`)
  } catch (cause) {
    log(`start failed: ${cause.message}`)
    await rollback()
    process.exit(1)
  }

  log("removing the old container")
  await call(`/containers/${oldId}?v=false`, "DELETE").catch((cause) =>
    log(`could not remove the old container: ${cause.message}`)
  )

  log("done")
}

main().catch((cause) => {
  log(`failed: ${cause.message}`)
  process.exit(1)
})
