import { z } from "zod"

import { jsonError, parseBody, requireUserId } from "@/lib/api"
import { createApiToken } from "@/lib/api-tokens"
import { approveLoginFlow, loginFlowIsPending } from "@/lib/floccus/login-flow"
import { prisma } from "@/lib/prisma"

const bodySchema = z.object({ token: z.string().min(1).max(200) })

export const POST = async (request: Request) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { data, response } = await parseBody(request, bodySchema)

  if (!data) {
    return response
  }

  if (!loginFlowIsPending(data.token)) {
    return jsonError("This sync request expired", 404)
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  if (!user) {
    return jsonError("Unauthorized", 401)
  }

  const appPassword = await createApiToken(userId, "Browser sync (floccus)")

  approveLoginFlow(data.token, user.email, appPassword)

  return new Response(null, { status: 204 })
}
