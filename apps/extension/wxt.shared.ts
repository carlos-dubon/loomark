import { readFileSync } from "node:fs"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import type { UserConfig } from "wxt"

const { version } = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8")
) as { version: string }

const manifestVersion = version.match(/^\d+(\.\d+){0,3}/)?.[0] ?? "0.0.0"

export type Variant = "default" | "newtab"

const variants = {
  default: {
    name: "Loomark",
    description: "Save the page you are on to your Loomark collections.",
    geckoId: "loomark@loomark.app",
    zipName: "loomark-extension",
    outDirSuffix: "",
    entrypoints: ["background", "popup"],
  },
  newtab: {
    name: "Loomark New Tab",
    description:
      "Open Loomark in every new tab, and save the page you are on to your collections.",
    geckoId: "loomark-newtab@loomark.app",
    zipName: "loomark-extension-newtab",
    outDirSuffix: "-newtab",
    entrypoints: ["background", "popup", "newtab"],
  },
} as const satisfies Record<string, unknown>

export const variantConfig = (variant: Variant): UserConfig => {
  const { name, description, geckoId, zipName, outDirSuffix, entrypoints } =
    variants[variant]

  return {
    outDir: "output",
    outDirTemplate: `{{browser}}-mv{{manifestVersion}}${outDirSuffix}{{modeSuffix}}`,
    manifestVersion: 3,
    filterEntrypoints: [...entrypoints],
    zip: {
      name: zipName,
      artifactTemplate: "{{name}}-{{version}}-{{browser}}{{modeSuffix}}.zip",
      sourcesTemplate: "{{name}}-{{version}}-sources{{modeSuffix}}.zip",
    },
    manifest: ({ browser }) => ({
      name,
      short_name: "Loomark",
      version: manifestVersion,
      description,
      permissions: ["storage", "tabs"],
      optional_host_permissions: ["*://*/*"],
      action: { default_title: "Save to Loomark" },
      ...(browser === "firefox"
        ? {
            browser_specific_settings: {
              gecko: { id: geckoId, strict_min_version: "127.0" },
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
  }
}
