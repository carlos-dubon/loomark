import { jsonError, requireUserId } from "@/lib/api"
import { buildBookmarksFile } from "@/lib/netscape"
import { prisma } from "@/lib/prisma"
import { buildExportTree } from "@/lib/transfer"

export const GET = async () => {
  const userId = await requireUserId()

  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const [collections, bookmarks] = await Promise.all([
    prisma.collection.findMany({
      where: { userId, kind: "USER" },
      orderBy: { name: "asc" },
    }),
    prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const file = buildBookmarksFile(buildExportTree(collections, bookmarks))
  const stamp = new Date().toISOString().slice(0, 10)

  return new Response(file, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-disposition": `attachment; filename="tana-bookmarks-${stamp}.html"`,
      "cache-control": "no-store",
    },
  })
}
