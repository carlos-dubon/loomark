import { fileURLToPath } from "node:url"

import { base } from "../../prettier.config.mjs"

const config = {
  ...base,
  tailwindStylesheet: fileURLToPath(
    new URL("./assets/tailwind.css", import.meta.url)
  ),
}

export default config
