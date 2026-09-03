import { reorderWithin } from "@loomark/core/order"
import type { SyncSnapshot } from "@loomark/core/types"

import { jsonError, parseBody, requireUserId } from "@/lib/api"
import { ensureUnsortedCollection } from "@/lib/collections"
import { prisma } from "@/lib/prisma"
import { syncReorderSchema } from "@/lib/schemas"
import {
  containerOf,
  loadSiblings,
  renumber,
  unsortedCollectionId,
} from "@/lib/siblings"

const ROOT = "__root__"

export const GET = async () => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  await ensureUnsortedCollection(userId)

  const [collections, bookmarks] = await Promise.all([
    prisma.collection.findMany({
      where: { userId },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        parentId: true,
        kind: true,
        position: true,
      },
    }),
    prisma.bookmark.findMany({
      where: { userId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        url: true,
        title: true,
        collectionId: true,
        position: true,
      },
    }),
  ])

  return Response.json({ collections, bookmarks } satisfies SyncSnapshot, {
    headers: { "cache-control": "no-store" },
  })
}

export const POST = async (request: Request) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { data, response } = await parseBody(request, syncReorderSchema)

  if (!data) {
    return response
  }

  const unsortedId = await unsortedCollectionId(userId)
  const containers = new Map<
    string,
    { container: string | null; groups: typeof data.groups }
  >()

  for (const group of data.groups) {
    const container = containerOf(group.collectionId, unsortedId)
    const key = container ?? ROOT
    const entry = containers.get(key) ?? { container, groups: [] }

    entry.groups.push(group)
    containers.set(key, entry)
  }

  const updates = []

  for (const { container, groups } of containers.values()) {
    let siblings = await loadSiblings(userId, container, unsortedId)

    for (const group of groups) {
      if (group.type === "all") {
        const wanted = new Map(group.ids.map((id, index) => [id, index]))
        const fallback = new Map(
          siblings.map((sibling, index) => [
            sibling.id,
            group.ids.length + index,
          ])
        )
        const rank = (id: string) => wanted.get(id) ?? fallback.get(id) ?? 0

        siblings = [...siblings].sort((a, b) => rank(a.id) - rank(b.id))
        continue
      }

      const known = new Set(
        siblings.flatMap((sibling) =>
          sibling.type === group.type ? [sibling.id] : []
        )
      )
      const ids = group.ids.filter((id) => known.has(id))

      if (ids.length > 0) {
        siblings = reorderWithin(siblings, group.type, ids)
      }
    }

    updates.push(...renumber(siblings))
  }

  if (updates.length > 0) {
    await prisma.$transaction(updates)
  }

  return new Response(null, { status: 204 })
}
