import { env } from "@/lib/config/env";
import { ActionGatewayAdapter } from "./action-gateway-adapter";
import { DirectToolAdapter } from "./direct-tool-adapter";
import type { PreciselyClient } from "./types";

export function createPreciselyClient(): PreciselyClient {
  if (!env.PRECISELY_MCP_URL) throw new Error("PRECISELY_MCP_URL is required.");
  const headers=env.PRECISELY_API_KEY&&env.PRECISELY_API_SECRET?{Authorization:`Apikey ${Buffer.from(`${env.PRECISELY_API_KEY}:${env.PRECISELY_API_SECRET}`).toString("base64")}`} : undefined;
  return env.INSTALLIQ_DATA_MODE === "hosted" ? new ActionGatewayAdapter(env.PRECISELY_MCP_URL,headers?{headers}:undefined) : new DirectToolAdapter(env.PRECISELY_MCP_URL);
}
