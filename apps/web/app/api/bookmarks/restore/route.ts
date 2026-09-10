import { parseBody, withUser } from "@/lib/server/api"
import { ensureUnsortedCollection } from "@/lib/server/collections"
import { prisma } from "@/lib/server/prisma"
import { bookmarkRestoreSchema } from "@/lib/schemas"
import { serializeBookmark } from "@/lib/server/serialize"

export const POST = withUser(async (request, userId) => {
  const { data, response } = await parseBody(request, bookmarkRestoreSchema)

  if (!data) {
    return response
  }

  const wanted = new Set(
    data.bookmarks
      .map((bookmark) => bookmark.collectionId)
      .filter((id) => id !== null && id !== undefined)
  )

  const owned = await prisma.collection.findMany({
    where: { userId, id: { in: [...wanted] } },
    select: { id: true },
  })

  const valid = new Set(owned.map((collection) => collection.id))
  const fallback = await ensureUnsortedCollection(userId)

  const restored = await prisma.$transaction(
    data.bookmarks.map((bookmark) => {
      const values = {
        userId,
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description ?? null,
        faviconUrl: bookmark.faviconUrl ?? null,
        previewUrl: bookmark.previewUrl ?? null,
        pinned: bookmark.pinned ?? false,
        position: bookmark.position ?? 0,
        pinnedPosition: bookmark.pinnedPosition ?? 0,
        collectionId:
          bookmark.collectionId && valid.has(bookmark.collectionId)
            ? bookmark.collectionId
            : fallback,
      }

      return prisma.bookmark.upsert({
        where: { id: bookmark.id },
        create: { ...values, id: bookmark.id, createdAt: bookmark.createdAt },
        update: values,
      })
    })
  )

  return Response.json(restored.map(serializeBookmark), { status: 201 })
})
