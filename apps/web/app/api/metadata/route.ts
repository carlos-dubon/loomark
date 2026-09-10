import { parseQuery, withUser } from "@/lib/server/api"
import { fetchUrlMetadata } from "@/lib/server/metadata"
import { metadataQuerySchema } from "@/lib/schemas"

export const GET = withUser(async (request) => {
  const { data, response } = parseQuery(request, metadataQuerySchema)

  if (!data) {
    return response
  }

  return Response.json(await fetchUrlMetadata(data.url))
})
