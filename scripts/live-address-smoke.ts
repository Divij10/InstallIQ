import { createPreciselyClient } from "../lib/precisely/client";

async function main() {
  const client = createPreciselyClient();
  const health = await client.health();
  if (!health.connected) {
    console.error(`Live address smoke test requires a connected local or hosted MCP server. ${health.message ?? ""}`);
    process.exitCode = 1;
    return;
  }
  const result = await client.invoke("ADDRESS_VERIFY", { address: process.env.INSTALLIQ_SMOKE_ADDRESS ?? "21001 N Tatum Blvd, Phoenix, AZ 85050" });
  console.log(`Mode: ${health.mode}`);
  console.log(`Address verification: ${result.status}`);
  console.log(`Gateway tool: ${result.toolName ?? "not resolved"}`);
  if (result.message) console.log(`Details: ${result.message}`);
  await client.close();
  if (result.status !== "success") process.exitCode = 1;
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Live address smoke test failed"); process.exitCode = 1; });
