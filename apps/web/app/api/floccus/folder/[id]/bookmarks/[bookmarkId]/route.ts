import { floccusError, floccusOk } from "@/lib/floccus/respond"
import { floccusSession } from "@/lib/floccus/session"
import { ROOT_ID, unsortedCollectionId } from "@/lib/floccus/tree"
import { prisma } from "@/lib/prisma"

type Context = { params: Promise<{ id: string; bookmarkId: string }> }

export const DELETE = async (_request: Request, { params }: Context) => {
  const session = await floccusSession()

  if (!session) {
    return floccusError("Unauthorized", 401)
  }

  const { id, bookmarkId } = await params
  const collectionId =
    id === ROOT_ID ? await unsortedCollectionId(session.userId) : id

  if (collectionId) {
    await prisma.bookmark.deleteMany({
      where: { id: bookmarkId, userId: session.userId, collectionId },
    })
  }

  return floccusOk(session)
}
