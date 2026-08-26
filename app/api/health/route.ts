import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export const GET = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`

    return Response.json({ status: "ok" })
  } catch {
    return Response.json({ status: "degraded" }, { status: 503 })
  }
}
