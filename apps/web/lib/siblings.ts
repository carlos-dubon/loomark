import { compareSiblings } from "@loomark/core/order"

import { prisma } from "@/lib/prisma"

import type { Sibling } from "@loomark/core/order"

export const unsortedCollectionId = async (userId: string) =>
  (
    await prisma.collection.findFirst({
      where: { userId, kind: "UNSORTED" },
      select: { id: true },
    })
  )?.id ?? null

export const containerOf = (
  collectionId: string | null | undefined,
  unsortedId: string | null
) => (!collectionId || collectionId === unsortedId ? null : collectionId)

export const loadSiblings = async (
  userId: string,
  container: string | null,
  unsortedId: string | null
): Promise<Sibling[]> => {
  const bookmarkCollectionId = container ?? unsortedId

  const [collections, bookmarks] = await Promise.all([
    prisma.collection.findMany({
      where: { userId, kind: "USER", parentId: container },
      select: { id: true, name: true, position: true },
    }),
    bookmarkCollectionId
      ? prisma.bookmark.findMany({
          where: { userId, collectionId: bookmarkCollectionId },
          select: { id: true, title: true, position: true },
        })
      : [],
  ])

  return [
    ...collections.map((collection) => ({
      type: "collection" as const,
      id: collection.id,
      title: collection.name,
      position: collection.position,
    })),
    ...bookmarks.map((bookmark) => ({
      type: "bookmark" as const,
      id: bookmark.id,
      title: bookmark.title,
      position: bookmark.position,
    })),
  ].sort(compareSiblings)
}

export const nextSiblingPosition = async (
  userId: string,
  container: string | null,
  unsortedId: string | null
) => {
  const bookmarkCollectionId = container ?? unsortedId

  const [collections, bookmarks] = await Promise.all([
    prisma.collection.aggregate({
      where: { userId, kind: "USER", parentId: container },
      _max: { position: true },
    }),
    bookmarkCollectionId
      ? prisma.bookmark.aggregate({
          where: { userId, collectionId: bookmarkCollectionId },
          _max: { position: true },
        })
      : null,
  ])

  return (
    Math.max(collections._max.position ?? -1, bookmarks?._max.position ?? -1) +
    1
  )
}

export const renumber = (siblings: Sibling[]) =>
  siblings.flatMap((sibling, position) =>
    sibling.position === position
      ? []
      : [
          sibling.type === "collection"
            ? prisma.collection.update({
                where: { id: sibling.id },
                data: { position },
              })
            : prisma.bookmark.update({
                where: { id: sibling.id },
                data: { position },
              }),
        ]
  )

export const normalizeUserPositions = async (userId: string) => {
  await prisma.$queryRaw`
    WITH items AS (
      SELECT
        'collection' AS kind,
        c."id",
        c."parentId" AS container,
        c."position",
        0 AS rank,
        c."name" AS title
      FROM "Collection" c
      WHERE c."userId" = ${userId} AND c."kind" = 'USER'
      UNION ALL
      SELECT
        'bookmark',
        b."id",
        CASE WHEN p."kind" = 'UNSORTED' THEN NULL ELSE b."collectionId" END,
        b."position",
        1,
        b."title"
      FROM "Bookmark" b
      JOIN "Collection" p ON p."id" = b."collectionId"
      WHERE b."userId" = ${userId}
    ),
    ranked AS (
      SELECT
        kind,
        "id",
        ROW_NUMBER() OVER (
          PARTITION BY container
          ORDER BY "position", rank, title, "id"
        ) - 1 AS next
      FROM items
    ),
    collections AS (
      UPDATE "Collection" c
      SET "position" = r.next
      FROM ranked r
      WHERE r.kind = 'collection' AND c."id" = r."id" AND c."position" <> r.next
      RETURNING 1
    ),
    bookmarks AS (
      UPDATE "Bookmark" b
      SET "position" = r.next
      FROM ranked r
      WHERE r.kind = 'bookmark' AND b."id" = r."id" AND b."position" <> r.next
      RETURNING 1
    )
    SELECT
      (SELECT COUNT(*) FROM collections) AS collections,
      (SELECT COUNT(*) FROM bookmarks) AS bookmarks
  `
}
