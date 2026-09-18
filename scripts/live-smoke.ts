async function main() {
if (process.env.INSTALLIQ_DATA_MODE !== "local" && process.env.INSTALLIQ_DATA_MODE !== "hosted") {
  console.log("Live smoke test skipped: set INSTALLIQ_DATA_MODE to local or hosted and configure a live MCP endpoint.");
} else if (!process.env.PRECISELY_MCP_URL) {
  console.log("Live smoke test skipped: PRECISELY_MCP_URL is not configured.");
} else {
  await import("./verify-mcp");
}
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Live smoke test failed"); process.exitCode = 1; });
