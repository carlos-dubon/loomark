import { routes } from "@loomark/core/routes"

import { prisma } from "@/lib/prisma"

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024

export const AVATAR_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const

export const isAvatarContentType = (value: string) =>
  (AVATAR_CONTENT_TYPES as readonly string[]).includes(value)

const avatarUrl = (userId: string, version: number) =>
  `${routes.userAvatar(userId)}?v=${version}`

export const readAvatar = (userId: string) =>
  prisma.avatar.findUnique({
    where: { userId },
    select: { data: true, contentType: true, updatedAt: true },
  })

export const saveAvatar = async (
  userId: string,
  data: Uint8Array<ArrayBuffer>,
  contentType: string
) => {
  const avatar = await prisma.avatar.upsert({
    where: { userId },
    create: { userId, data, contentType, bytes: data.byteLength },
    update: { data, contentType, bytes: data.byteLength },
    select: { updatedAt: true },
  })

  const image = avatarUrl(userId, avatar.updatedAt.getTime())

  await prisma.user.update({ where: { id: userId }, data: { image } })

  return image
}

export const clearAvatar = async (userId: string) => {
  await prisma.avatar.deleteMany({ where: { userId } })
  await prisma.user.update({ where: { id: userId }, data: { image: null } })
}
