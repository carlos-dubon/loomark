import type { InstanceUserDTO } from "@loomark/core/types"

import { jsonError, requireUserId } from "@/lib/api"
import { prisma } from "@/lib/prisma"

type Numeric = bigint | number | string | null

type StorageRow = {
  id: string
  rowBytes: Numeric
}

const toNumber = (value: Numeric) => Number(value ?? 0)

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
        COALESCE(b."bytes", 0)
          + COALESCE(c."bytes", 0)
          + COALESCE(v."bytes", 0) AS "rowBytes"
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
      LEFT JOIN (
        SELECT "userId", SUM(pg_column_size(avatar.*)) AS "bytes"
        FROM "Avatar" avatar
        GROUP BY "userId"
      ) v ON v."userId" = u."id"
    `,
  ])

  const storageByUser = new Map(storage.map((row) => [row.id, row]))

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    bookmarkCount: user._count.bookmarks,
    collectionCount: user._count.collections,
    bytes: toNumber(storageByUser.get(user.id)?.rowBytes ?? 0),
  }))
}

export const deleteInstanceUser = async (userId: string) => {
  await prisma.$transaction([
    prisma.bookmark.deleteMany({ where: { userId } }),
    prisma.collection.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ])
}

export const withOwner =
  <C>(
    handler: (
      request: Request,
      ownerId: string,
      context: C
    ) => Promise<Response> | Response
  ) =>
  async (request: Request, context: C) => {
    const ownerId = await requireOwnerId()

    return ownerId
      ? await handler(request, ownerId, context)
      : jsonError("Unauthorized", 401)
  }
