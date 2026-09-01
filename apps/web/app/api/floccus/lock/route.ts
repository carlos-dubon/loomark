import { acquireSyncLock, releaseSyncLock } from "@/lib/floccus/lock"
import { floccusError } from "@/lib/floccus/respond"
import { floccusSession } from "@/lib/floccus/session"

export const POST = async () => {
  const session = await floccusSession({ renew: false })

  if (!session) {
    return floccusError("Unauthorized", 401)
  }

  return new Response(null, {
    status: acquireSyncLock(session.userId) ? 200 : 423,
  })
}

export const DELETE = async () => {
  const session = await floccusSession({ renew: false })

  if (!session) {
    return floccusError("Unauthorized", 401)
  }

  releaseSyncLock(session.userId)

  return new Response(null, { status: 200 })
}
