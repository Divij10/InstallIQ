import { evidence } from "@/lib/domain/evidence";
import type { PreciselyInvocationResult } from "./types";

export function asPreciselyEvidence(capability: string, result: PreciselyInvocationResult) {
  return evidence({
    status: result.status,
    source: { provider: "Precisely", transport: "mcp", capability, toolName: result.toolName, actionName: result.actionName },
    data: result.data,
    message: result.message,
    rawAvailable: Boolean(result.raw),
    raw: result.raw
  });
}
