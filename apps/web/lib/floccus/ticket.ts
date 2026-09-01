import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

const TTL_MS = 2 * 60 * 60 * 1000

const secret = () => process.env.AUTH_SECRET ?? ""

const sign = (payload: string, key: string) =>
  createHmac("sha256", key).update(payload).digest("base64url")

export const issueTicket = (userId: string) => {
  const key = secret()

  if (!key) {
    return null
  }

  const payload = Buffer.from(
    JSON.stringify({
      u: userId,
      e: Date.now() + TTL_MS,
      n: randomBytes(9).toString("base64url"),
    })
  ).toString("base64url")

  return `${payload}.${sign(payload, key)}`
}

export const ticketUserId = (ticket: string) => {
  const key = secret()
  const [payload, signature] = ticket.split(".")

  if (!key || !payload || !signature) {
    return null
  }

  const expected = Buffer.from(sign(payload, key))
  const received = Buffer.from(signature)

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null
  }

  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { u?: unknown; e?: unknown }

    if (typeof claims.u !== "string" || typeof claims.e !== "number") {
      return null
    }

    return claims.e > Date.now() ? claims.u : null
  } catch {
    return null
  }
}
