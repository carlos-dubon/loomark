import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@loomark/core", "@loomark/ui"],
  serverExternalPackages: [
    "@prisma/adapter-pg",
    "bcryptjs",
    "playwright-core",
    "turndown",
  ],
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
