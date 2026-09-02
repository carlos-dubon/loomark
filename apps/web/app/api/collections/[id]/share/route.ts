import type { CollectionShareDTO } from "@loomark/core/types"

import { jsonError, requireUserId } from "@/lib/api"
import { prisma } from "@/lib/prisma"
import { createShareToken } from "@/lib/share"

type Context = { params: Promise<{ id: string }> }

const serializeShare = (collection: {
  id: string
  shareToken: string | null
  sharedAt: Date | null
}): CollectionShareDTO => ({
  id: collection.id,
  shareToken: collection.shareToken,
  sharedAt: collection.sharedAt?.toISOString() ?? null,
})

const shareable = async (userId: string, id: string) => {
  const collection = await prisma.collection.findFirst({
    where: { id, userId },
    select: { id: true, kind: true },
  })

  if (!collection) {
    return { error: jsonError("Collection not found", 404) }
  }

  if (collection.kind === "UNSORTED") {
    return { error: jsonError("Unsorted cannot be shared", 400) }
  }

  return { error: null }
}

export const POST = async (_request: Request, { params }: Context) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { id } = await params
  const { error } = await shareable(userId, id)

  if (error) {
    return error
  }

  const collection = await prisma.collection.update({
    where: { id },
    data: { shareToken: createShareToken(), sharedAt: new Date() },
    select: { id: true, shareToken: true, sharedAt: true },
  })

  return Response.json(serializeShare(collection))
}

export const DELETE = async (_request: Request, { params }: Context) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { id } = await params
  const { error } = await shareable(userId, id)

  if (error) {
    return error
  }

  const collection = await prisma.collection.update({
    where: { id },
    data: { shareToken: null, sharedAt: null },
    select: { id: true, shareToken: true, sharedAt: true },
  })

  return Response.json(serializeShare(collection))
}
