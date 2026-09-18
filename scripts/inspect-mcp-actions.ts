import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { env } from "../lib/config/env";

const actionIds = process.argv.slice(2);

async function main() {
  if (!actionIds.length) throw new Error("Pass one or more Precisely action IDs.");
  if (!env.PRECISELY_MCP_URL || !env.PRECISELY_API_KEY || !env.PRECISELY_API_SECRET) throw new Error("Hosted Precisely credentials are required.");
  const authorization = `Apikey ${Buffer.from(`${env.PRECISELY_API_KEY}:${env.PRECISELY_API_SECRET}`).toString("base64")}`;
  const client = new Client({ name: "installiq-action-inspector", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(env.PRECISELY_MCP_URL), { requestInit: { headers: { Authorization: authorization } } }));
  try {
    const describe = (await client.listTools()).tools.find((tool) => tool.name === "precisely_actions_describe");
    if (!describe) throw new Error("This endpoint is not the hosted Precisely action gateway.");
    for (const actionId of actionIds) {
      const response = await client.callTool({ name: describe.name, arguments: { action_id: actionId } });
      console.log(JSON.stringify(response.structuredContent ?? response.content));
    }
  } finally { await client.close(); }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Action inspection failed."); process.exitCode = 1; });
