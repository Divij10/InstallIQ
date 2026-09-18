import { defineConfig } from "vitest/config"; import path from "node:path";
export default defineConfig({test:{environment:"jsdom",globals:true,exclude:["tests/e2e/**","node_modules/**","dist/**"]},resolve:{alias:{"@":path.resolve(__dirname,".")}}});
