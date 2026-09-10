import { jsonError, withUser } from "@/lib/server/api"
import { readAvatar } from "@/lib/server/avatars"

type Context = { params: Promise<{ id: string }> }

export const GET = withUser(async (_request, _userId, { params }: Context) => {
  const { id } = await params
  const avatar = await readAvatar(id)

  if (!avatar) {
    return jsonError("Not found", 404)
  }

  return new Response(avatar.data, {
    headers: {
      "content-type": avatar.contentType,
      "content-length": String(avatar.data.byteLength),
      "cache-control": "private, max-age=31536000, immutable",
      etag: `"${avatar.updatedAt.getTime()}"`,
    },
  })
})
