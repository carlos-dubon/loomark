import { createLoginFlow } from "@/lib/floccus/login-flow"

export const POST = async (request: Request) => {
  const origin = new URL(request.url).origin
  const token = createLoginFlow()

  return Response.json({
    poll: {
      token,
      endpoint: `${origin}/index.php/login/v2/poll`,
    },
    login: `${origin}/floccus-authorize?token=${token}`,
  })
}
