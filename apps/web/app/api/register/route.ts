import { hash } from "bcryptjs"

import { jsonError, parseBody } from "@/lib/api"
import { ensureUnsortedCollection } from "@/lib/collections"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/schemas"

export const POST = async (request: Request) => {
  const { data, response } = await parseBody(request, registerSchema)

  if (!data) {
    return response
  }

  const userCount = await prisma.user.count()

  if (userCount > 0 && process.env.ALLOW_REGISTRATION === "false") {
    return jsonError("Registration is disabled on this instance", 403)
  }

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existing) {
    return jsonError("An account with that email already exists", 409)
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await hash(data.password, 12),
      role: userCount === 0 ? "OWNER" : "MEMBER",
    },
  })

  await ensureUnsortedCollection(user.id)

  return Response.json({ id: user.id, email: user.email }, { status: 201 })
}
