import { floccusError, floccusOk } from "@/lib/floccus/respond"
import { floccusSession } from "@/lib/floccus/session"
import { hashNode, loadTree } from "@/lib/floccus/tree"

type Context = { params: Promise<{ id: string }> }

export const GET = async (request: Request, { params }: Context) => {
  const session = await floccusSession()

  if (!session) {
    return floccusError("Unauthorized", 401)
  }

  const { id } = await params
  const hashFn = new URL(request.url).searchParams.get("hashFn") ?? "sha256"

  if (hashFn !== "sha256") {
    return floccusError(`Unsupported hash function: ${hashFn}`, 400)
  }

  const tree = await loadTree(session.userId)
  const folder = tree.folders.get(id)

  if (!folder) {
    return floccusError("Folder not found", 404)
  }

  return floccusOk(session, { data: hashNode(folder) })
}
