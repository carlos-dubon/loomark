import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/adapter-pg", "bcryptjs"],
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
  ],
}

export default nextConfig
