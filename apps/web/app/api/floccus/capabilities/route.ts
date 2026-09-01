import { floccusError } from "@/lib/floccus/respond"
import { floccusSession } from "@/lib/floccus/session"

export const GET = async () => {
  const session = await floccusSession()

  if (!session) {
    return floccusError("Unauthorized", 401)
  }

  return Response.json({
    ocs: {
      meta: { status: "ok", statuscode: 200, message: "OK" },
      data: {
        capabilities: {
          bookmarks: {
            "api-version": "2.0.0",
            "javascript-bookmarks": false,
            "hash-functions": ["sha256"],
          },
        },
      },
    },
  })
}
