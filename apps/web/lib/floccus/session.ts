import { compare } from "bcryptjs"
import { headers } from "next/headers"

import {
  API_TOKEN_PREFIX,
  bearerToken,
  userIdFromApiToken,
} from "@/lib/api-tokens"
import { renewSyncLock } from "@/lib/floccus/lock"
import { issueTicket, ticketUserId } from "@/lib/floccus/ticket"
import { prisma } from "@/lib/prisma"

export type FloccusSession = { userId: string; ticket: string | null }

const basicCredentials = (authorization: string) => {
  const decoded = Buffer.from(authorization.slice(6).trim(), "base64").toString(
    "utf8"
  )
  const separator = decoded.indexOf(":")

  return separator === -1
    ? null
    : {
        email: decoded.slice(0, separator),
        password: decoded.slice(separator + 1),
      }
}

const userIdFromPassword = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, passwordHash: true },
  })

  if (!user) {
    return null
  }

  if (password.startsWith(API_TOKEN_PREFIX)) {
    return (await userIdFromApiToken(password)) === user.id ? user.id : null
  }

  return user.passwordHash && (await compare(password, user.passwordHash))
    ? user.id
    : null
}

export const floccusSession = async ({
  renew = true,
}: { renew?: boolean } = {}): Promise<FloccusSession | null> => {
  const authorization = (await headers()).get("authorization")
  const token = bearerToken(authorization)

  let userId: string | null = null
  let ticket: string | null = null

  if (token) {
    userId = token.startsWith(API_TOKEN_PREFIX)
      ? await userIdFromApiToken(token)
      : ticketUserId(token)
  } else if (authorization?.toLowerCase().startsWith("basic ")) {
    const credentials = basicCredentials(authorization)

    userId = credentials
      ? await userIdFromPassword(credentials.email, credentials.password)
      : null
    ticket = userId ? issueTicket(userId) : null
  }

  if (!userId) {
    return null
  }

  if (renew) {
    renewSyncLock(userId)
  }

  return { userId, ticket }
}
