import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CapabilitySummary, DiscoveredMcpTool, PreciselyActionCandidate, PreciselyCapability, PreciselyClient, PreciselyHealth, PreciselyInvocationResult } from "./types";
import { capabilities } from "./types";
import { mapToolToCapability } from "./capability-registry";
import { McpConnectionError, CapabilityUnavailableError, ToolExecutionError } from "./errors";

type Tool = DiscoveredMcpTool;
const asRecord = (value: unknown): Record<string, unknown> | undefined => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
function collectActions(value: unknown, found = new Map<string, PreciselyActionCandidate>()): PreciselyActionCandidate[] {
  if (Array.isArray(value)) { value.forEach((item) => collectActions(item, found)); return [...found.values()]; }
  const record = asRecord(value);
  if (!record) return [...found.values()];
  if (typeof record.text === "string") { try { collectActions(JSON.parse(record.text), found); } catch { /* ordinary tool text */ } }
  if (typeof record.action_id === "string") found.set(record.action_id, { actionId: record.action_id, title: typeof record.title === "string" ? record.title : undefined, description: typeof record.description === "string" ? record.description : undefined, domain: typeof record.domain === "string" ? record.domain : undefined });
  Object.values(record).forEach((child) => collectActions(child, found));
  return [...found.values()];
}
export class DirectToolAdapter implements PreciselyClient {
  protected client?: Client; protected tools: Tool[] = [];
  constructor(private url: string, private mode: "local" | "hosted" = "local", private requestInit?:RequestInit) {}
  async connect() { try { this.client = new Client({ name: "installiq", version: "1.0.0" }); await this.client.connect(new StreamableHTTPClientTransport(new URL(this.url),{requestInit:this.requestInit})); const result = await this.client.listTools(); this.tools = result.tools as Tool[]; } catch (error) { throw new McpConnectionError(error instanceof Error ? error.message : "Could not connect to MCP server."); } }
  async listCapabilities(): Promise<CapabilitySummary[]> { return capabilities.map((capability) => { const tool = this.tools.find((t) => mapToolToCapability(t.name) === capability); return { capability, available: Boolean(tool), toolName: tool?.name, description: tool?.description }; }); }
  async health(): Promise<PreciselyHealth> { try { if (!this.client) await this.connect(); return { mode: this.mode, connected: true, capabilities: await this.listCapabilities(), tools: this.tools }; } catch (error) { return { mode: this.mode, connected: false, capabilities: [], message: error instanceof Error ? error.message : "MCP connection failed" }; } }
  async searchActions(goal: string, maxResults = 8): Promise<PreciselyActionCandidate[]> { if (!this.client) await this.connect(); const search = this.tools.find((tool) => tool.name === "precisely_actions_search"); if (!search) return []; const result = await this.client!.callTool({ name: search.name, arguments: { goal, max_results: maxResults } }); return collectActions(result.structuredContent ?? result.content); }
  async invoke(capability: PreciselyCapability, input: unknown): Promise<PreciselyInvocationResult> { if (!this.client) await this.connect(); const tool = this.tools.find((t) => mapToolToCapability(t.name) === capability); if (!tool) return { status: "unavailable", message: `No discovered MCP tool maps to ${capability}.` }; try { const result = await this.client!.callTool({ name: tool.name, arguments: (input ?? {}) as Record<string, unknown> }); const structured = result.structuredContent ?? result.content; return result.isError ? { status: "error", message: JSON.stringify(structured), toolName: tool.name } : { status: "success", data: structured, raw: structured, toolName: tool.name }; } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "Tool execution failed.", toolName: tool.name }; } }
  async close() { await this.client?.close(); this.client = undefined; }
}
