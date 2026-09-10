import { normalizeUrl } from "@loomark/core/url"

import { jsonError, parseQuery, withUser } from "@/lib/api"
import { prisma } from "@/lib/prisma"
import { bookmarkLookupSchema } from "@/lib/schemas"
import { serializeBookmark } from "@/lib/serialize"

export const GET = withUser(async (request, userId) => {
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
})
