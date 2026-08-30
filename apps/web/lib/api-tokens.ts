import { createHash, randomBytes } from "node:crypto"

import { prisma } from "@/lib/prisma"

const PREFIX = "lmk_"
const STALE_MS = 60 * 60 * 1000

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex")

export const createApiToken = async (userId: string, name: string) => {
  const token = `${PREFIX}${randomBytes(32).toString("base64url")}`

  await prisma.apiToken.create({
    data: { userId, name, tokenHash: hashToken(token) },
    select: { id: true },
  })

  return token
}

export const userIdFromApiToken = async (token: string) => {
  if (!token.startsWith(PREFIX)) {
    return null
  }

  const record = await prisma.apiToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, lastUsedAt: true },
  })

  if (!record) {
    return null
  }

  if (Date.now() - record.lastUsedAt.getTime() > STALE_MS) {
    void prisma.apiToken
      .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
      .catch(() => null)
  }

  return record.userId
}

export const revokeApiToken = async (userId: string, token: string) => {
  const { count } = await prisma.apiToken.deleteMany({
    where: { userId, tokenHash: hashToken(token) },
  })

  return count
}

export const bearerToken = (authorization: string | null) =>
  authorization?.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : null
