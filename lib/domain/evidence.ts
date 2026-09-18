export type EvidenceStatus = "success" | "not_found" | "unavailable" | "not_requested" | "error";

export type Evidence<T = unknown> = {
  id: string;
  status: EvidenceStatus;
  source: { provider: "Precisely" | "InstallIQ" | "AFDC"; transport?: "mcp" | "https"; capability: string; toolName?: string; actionName?: string };
  data?: T;
  message?: string;
  retrievedAt: string;
  rawAvailable: boolean;
  raw?: unknown;
};

let evidenceCount = 0;
export function evidence<T>(input: Omit<Evidence<T>, "id" | "retrievedAt">): Evidence<T> {
  return { id: `ev-${++evidenceCount}`, retrievedAt: new Date().toISOString(), ...input };
}
