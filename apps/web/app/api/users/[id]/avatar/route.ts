import { jsonError, requireUserId } from "@/lib/api"
import { readAvatar } from "@/lib/avatars"

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

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
}
