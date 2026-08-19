import { jsonError, parseBody, requireUserId } from "@/lib/api"
import { ensureUnsortedCollection } from "@/lib/collections"
import { prisma } from "@/lib/prisma"
import { getCollections } from "@/lib/queries"
import { collectionUpdateSchema } from "@/lib/schemas"
import { serializeCollection } from "@/lib/serialize"
import { collectDescendantIds } from "@/lib/tree"

type Context = { params: Promise<{ id: string }> }

export const PATCH = async (request: Request, { params }: Context) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { id } = await params
  const { data, response } = await parseBody(request, collectionUpdateSchema)

  if (!data) {
    return response
  }

  const collections = await getCollections(userId)
  const existing = collections.find((collection) => collection.id === id)

  if (!existing) {
    return jsonError("Collection not found", 404)
  }

  if (existing.kind === "UNSORTED") {
    return jsonError("Unsorted cannot be edited", 400)
  }

  if (data.parentId) {
    const parent = collections.find(
      (collection) => collection.id === data.parentId
    )

    if (!parent) {
      return jsonError("Parent collection not found", 404)
    }

    if (parent.kind === "UNSORTED") {
      return jsonError("Unsorted cannot hold collections", 400)
    }

    if (collectDescendantIds(collections, id).includes(data.parentId)) {
      return jsonError("A collection cannot be moved into itself", 400)
    }
  }

  const collection = await prisma.collection.update({
    where: { id },
    data: {
      name: data.name,
      parentId: data.parentId,
    },
    include: { _count: { select: { bookmarks: true } } },
  })

  return Response.json(serializeCollection(collection))
}

export const DELETE = async (_request: Request, { params }: Context) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { id } = await params
  const collections = await prisma.collection.findMany({
    where: { userId },
    select: { id: true, parentId: true, kind: true },
  })

  const existing = collections.find((collection) => collection.id === id)

  if (!existing) {
    return jsonError("Collection not found", 404)
  }

  if (existing.kind === "UNSORTED") {
    return jsonError("Unsorted cannot be deleted", 400)
  }

  const unsortedId = await ensureUnsortedCollection(userId)

  await prisma.$transaction([
    prisma.bookmark.updateMany({
      where: {
        userId,
        collectionId: { in: collectDescendantIds(collections, id) },
      },
      data: { collectionId: unsortedId },
    }),
    prisma.collection.delete({ where: { id } }),
  ])

  return new Response(null, { status: 204 })
}
