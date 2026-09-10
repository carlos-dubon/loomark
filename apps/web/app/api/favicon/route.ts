import { withUser } from "@/lib/server/api"
import { faviconTarget, proxyFavicon } from "@/lib/server/favicon"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export const GET = withUser(async (request) => {
  const { target, error } = faviconTarget(
    new URL(request.url).searchParams.get("url")
  )

  if (error) {
    return error
  }

  return proxyFavicon(target)
})
