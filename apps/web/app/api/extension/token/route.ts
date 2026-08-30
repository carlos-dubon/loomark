import { compare } from "bcryptjs"
import { headers } from "next/headers"

import { jsonError, parseBody, requireUserId } from "@/lib/api"
import { bearerToken, createApiToken, revokeApiToken } from "@/lib/api-tokens"
import { ensureUnsortedCollection } from "@/lib/collections"
import { prisma } from "@/lib/prisma"
import { apiTokenCreateSchema } from "@/lib/schemas"

const DEFAULT_NAME = "Browser extension"

export const POST = async (request: Request) => {
  const { data, response } = await parseBody(request, apiTokenCreateSchema)

  if (!data) {
    return response
  }

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true, name: true, email: true, passwordHash: true },
  })

  if (
    !user?.passwordHash ||
    !(await compare(data.password, user.passwordHash))
  ) {
    return jsonError("Invalid email or password", 401)
  }

  await ensureUnsortedCollection(user.id)

  const token = await createApiToken(user.id, data.name ?? DEFAULT_NAME)

  return Response.json(
    { token, user: { id: user.id, name: user.name, email: user.email } },
    { status: 201 }
  )
}

export const GET = async () => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  })

  if (!user) {
    return jsonError("Unauthorized", 401)
  }

  return Response.json({ user })
}

export const DELETE = async () => {
  const userId = await requireUserId()
  const token = bearerToken((await headers()).get("authorization"))

  if (!userId || !token) {
    return jsonError("Unauthorized", 401)
  }

  await revokeApiToken(userId, token)

  return new Response(null, { status: 204 })
}
