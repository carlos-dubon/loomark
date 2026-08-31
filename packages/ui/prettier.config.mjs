import { fileURLToPath } from "node:url"

import { base } from "../../prettier.config.mjs"

const config = {
  ...base,
  tailwindStylesheet: fileURLToPath(
    new URL("../../apps/web/app/globals.css", import.meta.url)
  ),
}

export default config
