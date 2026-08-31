import type { InstanceUserDTO } from "@loomark/core/types"

import { requireUserId } from "@/lib/api"
import { prisma } from "@/lib/prisma"

type StorageRow = { id: string; bytes: bigint | number | string | null }

export const getUserRole = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  return user?.role ?? null
}

export const requireOwnerId = async () => {
  const userId = await requireUserId()

  if (!userId) {
    return null
  }

  return (await getUserRole(userId)) === "OWNER" ? userId : null
}

export const getInstanceUsers = async (): Promise<InstanceUserDTO[]> => {
  const [users, storage] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        _count: { select: { bookmarks: true, collections: true } },
      },
    }),
    prisma.$queryRaw<StorageRow[]>`
      SELECT
        u."id" AS "id",
        COALESCE(b."bytes", 0) + COALESCE(c."bytes", 0) AS "bytes"
      FROM "User" u
      LEFT JOIN (
        SELECT "userId", SUM(pg_column_size(bookmark.*)) AS "bytes"
        FROM "Bookmark" bookmark
        GROUP BY "userId"
      ) b ON b."userId" = u."id"
      LEFT JOIN (
        SELECT "userId", SUM(pg_column_size(collection.*)) AS "bytes"
        FROM "Collection" collection
        GROUP BY "userId"
      ) c ON c."userId" = u."id"
    `,
  ])

  const bytesByUser = new Map(
    storage.map((row) => [row.id, Number(row.bytes ?? 0)])
  )

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    bookmarkCount: user._count.bookmarks,
    collectionCount: user._count.collections,
    bytes: bytesByUser.get(user.id) ?? 0,
  }))
}

export const deleteInstanceUser = (userId: string) =>
  prisma.$transaction([
    prisma.bookmark.deleteMany({ where: { userId } }),
    prisma.collection.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ])
