import type { NextConfig } from "next"

const FLOCCUS_REST = "/apps/bookmarks/public/rest/v2"

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
  rewrites: async () => [
    {
      source: `/index.php${FLOCCUS_REST}/:path*`,
      destination: "/api/floccus/:path*",
    },
    { source: `${FLOCCUS_REST}/:path*`, destination: "/api/floccus/:path*" },
    {
      source: "/index.php/ocs/v2.php/cloud/capabilities",
      destination: "/api/floccus/capabilities",
    },
    {
      source: "/ocs/v2.php/cloud/capabilities",
      destination: "/api/floccus/capabilities",
    },
    {
      source: "/index.php/login/v2",
      destination: "/api/floccus/login-flow",
    },
    {
      source: "/index.php/login/v2/poll",
      destination: "/api/floccus/login-flow/poll",
    },
  ],
}

export default nextConfig
