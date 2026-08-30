import { jsonError, parseQuery, requireUserId } from "@/lib/api"
import { normalizeUrl } from "@/lib/format"
import { prisma } from "@/lib/prisma"
import { bookmarkLookupSchema } from "@/lib/schemas"
import { serializeBookmark } from "@/lib/serialize"

export const GET = async (request: Request) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { data, response } = parseQuery(request, bookmarkLookupSchema)

  if (!data) {
    return response
  }

  let url: string

  try {
    url = normalizeUrl(data.url)
  } catch {
    return jsonError("Enter a valid URL", 422)
  }

  const bookmark = await prisma.bookmark.findFirst({
    where: { userId, url },
    orderBy: { createdAt: "desc" },
  })

  return Response.json(bookmark ? serializeBookmark(bookmark) : null)
}
