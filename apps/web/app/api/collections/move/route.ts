import { slotForTypeIndex } from "@loomark/core/order"
import { collectDescendantIds } from "@loomark/core/tree"

import { jsonError, parseBody, requireUserId } from "@/lib/api"
import { prisma } from "@/lib/prisma"
import { getCollections } from "@/lib/queries"
import { collectionMoveSchema } from "@/lib/schemas"
import { loadSiblings, renumber, unsortedCollectionId } from "@/lib/siblings"

export const POST = async (request: Request) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { data, response } = await parseBody(request, collectionMoveSchema)

  if (!data) {
    return response
  }

  const collections = await getCollections(userId)
  const moving = collections.find((collection) => collection.id === data.id)

  if (!moving) {
    return jsonError("Collection not found", 404)
  }

  if (moving.kind === "UNSORTED") {
    return jsonError("Unsorted cannot be moved", 400)
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

    if (collectDescendantIds(collections, data.id).includes(data.parentId)) {
      return jsonError("A collection cannot be moved into itself", 400)
    }
  }

  const unsortedId = await unsortedCollectionId(userId)
  const from = moving.parentId
  const to = data.parentId ?? null
  const sameParent = from === to

  const [source, destinationSiblings] = await Promise.all([
    loadSiblings(userId, from, unsortedId),
    sameParent ? null : loadSiblings(userId, to, unsortedId),
  ])

  const node = source.find(
    (sibling) => sibling.type === "collection" && sibling.id === data.id
  )

  if (!node) {
    return jsonError("Collection not found", 404)
  }

  const remaining = source.filter((sibling) => sibling !== node)
  const destination = destinationSiblings ?? remaining
  const slot = slotForTypeIndex(destination, "collection", data.index)
  const ordered = [
    ...destination.slice(0, slot),
    node,
    ...destination.slice(slot),
  ]

  await prisma.$transaction([
    ...(sameParent
      ? []
      : [
          prisma.collection.update({
            where: { id: data.id },
            data: { parentId: to },
          }),
          ...renumber(remaining),
        ]),
    ...renumber(ordered),
  ])

  const positions = new Map<string, number>()

  const record = (siblings: typeof ordered) =>
    siblings.forEach((sibling, position) => {
      if (sibling.type === "collection") {
        positions.set(sibling.id, position)
      }
    })

  if (!sameParent) {
    record(remaining)
  }

  record(ordered)

  return Response.json(
    collections.map((collection) => {
      const position = positions.get(collection.id)

      return {
        ...collection,
        ...(collection.id === data.id ? { parentId: to } : {}),
        ...(position === undefined ? {} : { position }),
      }
    })
  )
}
