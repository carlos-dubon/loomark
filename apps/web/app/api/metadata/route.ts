import { jsonError, parseQuery, requireUserId } from "@/lib/api"
import { fetchUrlMetadata } from "@/lib/metadata"
import { metadataQuerySchema } from "@/lib/schemas"

export const GET = async (request: Request) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { data, response } = parseQuery(request, metadataQuerySchema)

  if (!data) {
    return response
  }

  return Response.json(await fetchUrlMetadata(data.url))
}
