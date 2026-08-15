import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/adapter-pg", "bcryptjs"],
}

export default nextConfig
