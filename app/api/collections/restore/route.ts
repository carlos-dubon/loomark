import { jsonError, parseBody, requireUserId } from "@/lib/api"
import { ensureUnsortedCollection } from "@/lib/collections"
import { prisma } from "@/lib/prisma"
import { getCollections } from "@/lib/queries"
import { collectionRestoreSchema } from "@/lib/schemas"
import { parentsFirst } from "@/lib/tree"

export const POST = async (request: Request) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { data, response } = await parseBody(request, collectionRestoreSchema)

  if (!data) {
    return response
  }

  const existing = await prisma.collection.findMany({
    where: { userId },
    select: { id: true },
  })

  const alive = new Set(existing.map((collection) => collection.id))
  const ordered = parentsFirst(data.collections)
  const known = new Set([
    ...alive,
    ...ordered.map((collection) => collection.id),
  ])

  const creates = ordered
    .filter((collection) => !alive.has(collection.id))
    .map((collection) =>
      prisma.collection.create({
        data: {
          id: collection.id,
          userId,
          name: collection.name,
          icon: collection.icon ?? null,
          position: collection.position,
          parentId:
            collection.parentId && known.has(collection.parentId)
              ? collection.parentId
              : null,
        },
      })
    )

  const fallback = await ensureUnsortedCollection(userId)

  const bookmarks = data.bookmarks.map((bookmark) => {
    const values = {
      userId,
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description ?? null,
      faviconUrl: bookmark.faviconUrl ?? null,
      previewUrl: bookmark.previewUrl ?? null,
      pinned: bookmark.pinned ?? false,
      collectionId: known.has(bookmark.collectionId)
        ? bookmark.collectionId
        : fallback,
    }

    return prisma.bookmark.upsert({
      where: { id: bookmark.id },
      create: { ...values, id: bookmark.id, createdAt: bookmark.createdAt },
      update: values,
    })
  })

  await prisma.$transaction([...creates, ...bookmarks])

  return Response.json(await getCollections(userId), { status: 201 })
}
