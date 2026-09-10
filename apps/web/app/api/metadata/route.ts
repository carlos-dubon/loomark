import { parseQuery, withUser } from "@/lib/api"
import { fetchUrlMetadata } from "@/lib/metadata"
import { metadataQuerySchema } from "@/lib/schemas"

export const GET = withUser(async (request) => {
  const { data, response } = parseQuery(request, metadataQuerySchema)

  if (!data) {
    return response
  }

  return Response.json(await fetchUrlMetadata(data.url))
})
