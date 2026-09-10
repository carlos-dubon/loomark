import { jsonError, withUser } from "@/lib/api"
import {
  AVATAR_MAX_BYTES,
  clearAvatar,
  isAvatarContentType,
  saveAvatar,
} from "@/lib/avatars"

export const POST = withUser(async (request, userId) => {
  const form = await request.formData().catch(() => null)
  const file = form?.get("file")

  if (!(file instanceof File) || file.size === 0) {
    return jsonError("Choose an image to upload", 422)
  }

  if (!isAvatarContentType(file.type)) {
    return jsonError("Profile pictures must be a PNG, JPEG, WebP or GIF", 415)
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return jsonError("That image is larger than 2 MB", 413)
  }

  const data = new Uint8Array(await file.arrayBuffer())
  const image = await saveAvatar(userId, data, file.type)

  return Response.json({ image })
})

export const DELETE = withUser(async (_request, userId) => {
  await clearAvatar(userId)

  return Response.json({ image: null })
})
