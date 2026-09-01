import { floccusError, floccusOk } from "@/lib/floccus/respond"
import {
  floccusChildOrderSchema,
  parseFloccusBody,
} from "@/lib/floccus/schemas"
import { floccusSession } from "@/lib/floccus/session"
import { loadTree } from "@/lib/floccus/tree"
import { prisma } from "@/lib/prisma"

type Context = { params: Promise<{ id: string }> }

export const PATCH = async (request: Request, { params }: Context) => {
  const session = await floccusSession()

  if (!session) {
    return floccusError("Unauthorized", 401)
  }

  const { id } = await params
  const body = await parseFloccusBody(request, floccusChildOrderSchema)

  if (!body) {
    return floccusError("Invalid request body", 422)
  }

  const tree = await loadTree(session.userId)
  const folder = tree.folders.get(id)

  if (!folder) {
    return floccusError("Folder not found", 404)
  }

  const children = new Map(
    folder.children.map((child) => [`${child.type}:${child.id}`, child])
  )

  const updates = body.data.flatMap((entry, position) => {
    const child = children.get(`${entry.type}:${entry.id}`)

    if (!child || child.position === position) {
      return []
    }

    return [
      child.type === "folder"
        ? prisma.collection.update({
            where: { id: child.id },
            data: { position },
          })
        : prisma.bookmark.update({
            where: { id: child.id },
            data: { position },
          }),
    ]
  })

  if (updates.length > 0) {
    await prisma.$transaction(updates)
  }

  return floccusOk(session)
}
