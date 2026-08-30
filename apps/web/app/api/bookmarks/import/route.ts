import { jsonError, requireUserId } from "@/lib/api"
import { parseBookmarksFile } from "@/lib/netscape"
import { importBookmarksTree } from "@/lib/transfer"

const MAX_BYTES = 10 * 1024 * 1024

export const POST = async (request: Request) => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const form = await request.formData().catch(() => null)
  const file = form?.get("file")

  if (!(file instanceof File) || file.size === 0) {
    return jsonError("Choose a bookmarks file to import", 422)
  }

  if (file.size > MAX_BYTES) {
    return jsonError("That file is larger than 10 MB", 413)
  }

  const html = await file.text()

  if (!/<a\s[^>]*href=/i.test(html)) {
    return jsonError(
      "That does not look like a bookmarks file. Export one from Chrome with Bookmarks → Bookmark manager → Export bookmarks.",
      422
    )
  }

  const summary = await importBookmarksTree(userId, parseBookmarksFile(html))

  return Response.json(summary)
}
