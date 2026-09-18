import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

export default defineConfig(js.configs.recommended, { languageOptions: { globals: { ...globals.browser, ...globals.node } } }, globalIgnores([".next/**", "node_modules/**", "playwright-report/**", "test-results/**"]));
