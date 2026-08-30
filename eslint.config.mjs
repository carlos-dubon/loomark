import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/output/**",
    "**/next-env.d.ts",
    "**/lib/generated/**",
    "**/node_modules/**",
  ]),
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
