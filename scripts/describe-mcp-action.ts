import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { env } from "../lib/config/env";

type Tool = { name: string; inputSchema?: { properties?: Record<string, unknown> } };

function findActionId(value: unknown): string | undefined {
  if (Array.isArray(value)) return value.map(findActionId).find(Boolean);
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.text === "string") {
    try { return findActionId(JSON.parse(record.text)); } catch { /* not JSON */ }
  }
  if (typeof record.action_id === "string") return record.action_id;
  return Object.values(record).map(findActionId).find(Boolean);
}

async function main() {
  const args = process.argv.slice(2);
  const actionFlag = args.indexOf("--action");
  const requestedAction = actionFlag >= 0 ? args[actionFlag + 1] : undefined;
  const goal = (actionFlag >= 0 ? args.slice(0, actionFlag) : args).join(" ") || "validate and standardize a street address";
  if (env.INSTALLIQ_DATA_MODE !== "hosted" || !env.PRECISELY_MCP_URL || !env.PRECISELY_API_KEY || !env.PRECISELY_API_SECRET) {
    throw new Error("mcp:describe requires hosted mode plus the configured Precisely MCP URL, API key, and API secret.");
  }

  const authorization = `Apikey ${Buffer.from(`${env.PRECISELY_API_KEY}:${env.PRECISELY_API_SECRET}`).toString("base64")}`;
  const client = new Client({ name: "installiq-action-inspector", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(env.PRECISELY_MCP_URL), { requestInit: { headers: { Authorization: authorization } } }));
  try {
    const tools = (await client.listTools()).tools as Tool[];
    const search = tools.find((tool) => tool.name === "precisely_actions_search");
    const describe = tools.find((tool) => tool.name === "precisely_actions_describe");
    if (!search || !describe) throw new Error("This MCP endpoint is not the hosted Precisely action gateway.");
    const found = requestedAction ? undefined : await client.callTool({ name: search.name, arguments: { goal, max_results: 3 } });
    const actionId = requestedAction ?? findActionId(found?.structuredContent ?? found?.content);
    if (!actionId) throw new Error(`No action was found for: ${goal}`);
    const details = await client.callTool({ name: describe.name, arguments: { action_id: actionId } });
    console.log(requestedAction ? `Action requested: ${requestedAction}` : `Goal: ${goal}`);
    console.log(`Action: ${actionId}`);
    console.log(JSON.stringify(details.structuredContent ?? details.content, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Could not inspect the Precisely action.");
  process.exitCode = 1;
});
