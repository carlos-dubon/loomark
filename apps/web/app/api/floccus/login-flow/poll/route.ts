import { consumeLoginFlow } from "@/lib/floccus/login-flow"

export const POST = async (request: Request) => {
  const form = await request.formData().catch(() => null)
  const token = form?.get("token")

  const credentials = typeof token === "string" ? consumeLoginFlow(token) : null

  if (!credentials) {
    return new Response(null, { status: 404 })
  }

  return Response.json({
    loginName: credentials.loginName,
    appPassword: credentials.appPassword,
  })
}
