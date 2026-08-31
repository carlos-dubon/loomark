import { jsonError, requireUserId } from "@/lib/api"
import { isLinkwardenBackup, parseLinkwardenBackup } from "@/lib/linkwarden"
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

  const contents = await file.text()

  if (contents.trimStart().startsWith("{")) {
    const backup = ((): unknown => {
      try {
        return JSON.parse(contents) as unknown
      } catch {
        return null
      }
    })()

    if (!isLinkwardenBackup(backup)) {
      return jsonError(
        "That JSON file does not look like a Linkwarden backup. Export one from Linkwarden with Settings → Import & Export → Export Data.",
        422
      )
    }

    return Response.json(
      await importBookmarksTree(userId, parseLinkwardenBackup(backup))
    )
  }

  if (!/<a\s[^>]*href=/i.test(contents)) {
    return jsonError(
      "That does not look like a bookmarks file. Export one from Chrome with Bookmarks → Bookmark manager → Export bookmarks.",
      422
    )
  }

  const summary = await importBookmarksTree(
    userId,
    parseBookmarksFile(contents)
  )

  return Response.json(summary)
}
