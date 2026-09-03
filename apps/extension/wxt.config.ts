import { readFileSync } from "node:fs"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "wxt"

const { version } = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8")
) as { version: string }

const manifestVersion = version.match(/^\d+(\.\d+){0,3}/)?.[0] ?? "0.0.0"

export default defineConfig({
  outDir: "output",
  manifestVersion: 3,
  zip: {
    name: "loomark-extension",
    artifactTemplate: "{{name}}-{{version}}-{{browser}}{{modeSuffix}}.zip",
    sourcesTemplate: "{{name}}-{{version}}-sources{{modeSuffix}}.zip",
  },
  manifest: ({ browser }) => ({
    name: "Loomark",
    short_name: "Loomark",
    version: manifestVersion,
    description: "Save the page you are on to your Loomark collections.",
    permissions: ["storage", "tabs", "alarms"],
    optional_permissions: ["bookmarks"],
    optional_host_permissions: ["*://*/*"],
    action: { default_title: "Save to Loomark" },
    ...(browser === "firefox"
      ? {
          browser_specific_settings: {
            gecko: { id: "loomark@loomark.app", strict_min_version: "127.0" },
          },
        }
      : {}),
  }),
  vite: () => ({
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          advancedChunks: {
            groups: [
              {
                name: "lucide-icons",
                test: /lucide-react[\\/].*[\\/]icons[\\/]/,
              },
            ],
          },
        },
      },
    },
  }),
})
