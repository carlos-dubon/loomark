import { jsonError, parseBody, requireUserId } from "@/lib/api"
import { prisma } from "@/lib/prisma"
import { getCollections } from "@/lib/queries"
import { collectionCreateSchema } from "@/lib/schemas"
import { serializeCollection } from "@/lib/serialize"
import { nextSiblingPosition, unsortedCollectionId } from "@/lib/siblings"

export const GET = async () => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  return Response.json(await getCollections(userId))
}

export const POST = async (request: Request) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { data, response } = await parseBody(request, collectionCreateSchema)

  if (!data) {
    return response
  }

  if (data.parentId) {
    const parent = await prisma.collection.findFirst({
      where: { id: data.parentId, userId },
      select: { id: true },
    })

    if (!parent) {
      return jsonError("Parent collection not found", 404)
    }
  }

  const parentId = data.parentId ?? null
  const unsortedId = await unsortedCollectionId(userId)

  const collection = await prisma.collection.create({
    data: {
      userId,
      name: data.name,
      icon: data.icon ?? null,
      parentId,
      position: await nextSiblingPosition(userId, parentId, unsortedId),
    },
    include: { _count: { select: { bookmarks: true } } },
  })

  return Response.json(serializeCollection(collection), { status: 201 })
}
