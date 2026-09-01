import { importIntoFolder } from "@/lib/floccus/import"
import { floccusError, floccusOk } from "@/lib/floccus/respond"
import { floccusSession } from "@/lib/floccus/session"
import { collectionIdForFolder, unsortedCollectionId } from "@/lib/floccus/tree"
import { parseBookmarksFile } from "@/lib/netscape"

type Context = { params: Promise<{ id: string }> }

const MAX_BYTES = 10 * 1024 * 1024

export const POST = async (request: Request, { params }: Context) => {
  const session = await floccusSession()

  if (!session) {
    return floccusError("Unauthorized", 401)
  }

  const { id } = await params

  if (!(await collectionIdForFolder(session.userId, id))) {
    return floccusError("Folder not found", 404)
  }

  const form = await request.formData().catch(() => null)
  const file = form?.get("bm_import")

  if (!(file instanceof File) || file.size === 0) {
    return floccusError("Missing bm_import file", 422)
  }

  if (file.size > MAX_BYTES) {
    return floccusError("That import is larger than 10 MB", 413)
  }

  const data = await importIntoFolder(
    session.userId,
    id,
    await unsortedCollectionId(session.userId),
    parseBookmarksFile(await file.text())
  )

  return floccusOk(session, { data })
}
