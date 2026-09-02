import { jsonError } from "@/lib/api"
import { faviconTarget, proxyFavicon } from "@/lib/favicon"
import { isSharedFaviconUrl } from "@/lib/share"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type Context = { params: Promise<{ token: string }> }

export const GET = async (request: Request, { params }: Context) => {
  const urlParam = new URL(request.url).searchParams.get("url")
  const { target, error } = faviconTarget(urlParam)

  if (error) {
    return error
  }

  const { token } = await params

  if (!urlParam || !(await isSharedFaviconUrl(token, urlParam))) {
    return jsonError("Not found", 404)
  }

  return proxyFavicon(target)
}
