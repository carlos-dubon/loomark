import { floccusError, floccusOk } from "@/lib/floccus/respond"
import { floccusSession } from "@/lib/floccus/session"

export const POST = async () => {
  const session = await floccusSession()

  if (!session) {
    return floccusError("Unauthorized", 401)
  }

  return floccusOk(session)
}
