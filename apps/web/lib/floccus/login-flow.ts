import { randomBytes } from "node:crypto"

const TTL_MS = 10 * 60 * 1000

type Flow =
  | { status: "pending"; expiresAt: number }
  | { status: "approved"; loginName: string; appPassword: string }

const flows = new Map<string, Flow>()

const live = (token: string) => {
  const flow = flows.get(token)

  if (!flow) {
    return null
  }

  if (flow.status === "pending" && flow.expiresAt <= Date.now()) {
    flows.delete(token)
    return null
  }

  return flow
}

export const createLoginFlow = () => {
  const token = randomBytes(24).toString("base64url")

  flows.set(token, { status: "pending", expiresAt: Date.now() + TTL_MS })

  return token
}

export const loginFlowIsPending = (token: string) =>
  live(token)?.status === "pending"

export const approveLoginFlow = (
  token: string,
  loginName: string,
  appPassword: string
) => {
  if (!loginFlowIsPending(token)) {
    return false
  }

  flows.set(token, { status: "approved", loginName, appPassword })

  return true
}

export const consumeLoginFlow = (token: string) => {
  const flow = live(token)

  if (flow?.status !== "approved") {
    return null
  }

  flows.delete(token)

  return { loginName: flow.loginName, appPassword: flow.appPassword }
}
