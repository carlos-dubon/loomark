import "server-only"

import { headers } from "next/headers"
import type { ZodType } from "zod"

import { bearerToken, userIdFromApiToken } from "@/lib/server/api-tokens"
import { auth } from "@/lib/server/auth"

export const jsonError = (message: string, status: number) =>
  Response.json({ error: message }, { status })

export const requireUserId = async () => {
  const token = bearerToken((await headers()).get("authorization"))

  if (token) {
    return userIdFromApiToken(token)
  }

  const session = await auth()

  return session?.user?.id ?? null
}

export const parseBody = async <T>(request: Request, schema: ZodType<T>) => {
  const raw = await request.json().catch(() => null)
  const result = schema.safeParse(raw)

  if (!result.success) {
    return {
      data: null,
      response: Response.json(
        { error: "Invalid request body", issues: result.error.issues },
        { status: 422 }
      ),
    }
  }

  return { data: result.data, response: null }
}

export const parseQuery = <T>(request: Request, schema: ZodType<T>) => {
  const params = Object.fromEntries(new URL(request.url).searchParams)
  const result = schema.safeParse(params)

  if (!result.success) {
    return {
      data: null,
      response: Response.json(
        { error: "Invalid query parameters", issues: result.error.issues },
        { status: 422 }
      ),
    }
  }

  return { data: result.data, response: null }
}

export const withUser =
  <C>(
    handler: (
      request: Request,
      userId: string,
      context: C
    ) => Promise<Response> | Response
  ) =>
  async (request: Request, context: C) => {
    const userId = await requireUserId()

    return userId
      ? await handler(request, userId, context)
      : jsonError("Unauthorized", 401)
  }
