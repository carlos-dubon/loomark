import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export const GET = async () => {
  const version = process.env.APP_VERSION ?? "dev"

  try {
    await prisma.$queryRaw`SELECT 1`

    return Response.json({ status: "ok", version })
  } catch {
    return Response.json({ status: "degraded", version }, { status: 503 })
  }
}
