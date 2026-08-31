import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

export default defineConfig([
  globalIgnores([
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/dist/**",
    "**/output/**",
    "**/.wxt/**",
    "**/node_modules/**",
    "**/lib/generated/**",
    "**/next-env.d.ts",
  ]),
  {
    files: ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
    extends: [nextVitals, nextTs],
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    settings: { next: { rootDir: "apps/web" } },
  },
  {
    files: ["apps/extension/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
])
