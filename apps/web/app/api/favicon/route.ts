import { jsonError, requireUserId } from "@/lib/api"
import { faviconTarget, proxyFavicon } from "@/lib/favicon"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export const GET = async (request: Request) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const { target, error } = faviconTarget(
    new URL(request.url).searchParams.get("url")
  )

  if (error) {
    return error
  }

  return proxyFavicon(target)
}
