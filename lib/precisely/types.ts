export const capabilities = ["CONTACT_NAME_PARSE", "CONTACT_EMAIL_VERIFY", "CONTACT_PHONE_VALIDATE", "ADDRESS_AUTOCOMPLETE", "ADDRESS_VERIFY", "ADDRESS_GEOCODE", "PROPERTY_ATTRIBUTES", "BUILDING_INFORMATION", "PARCEL_INFORMATION", "ROOF_ATTRIBUTES", "TAX_JURISDICTION", "AUTHORITY_HAVING_JURISDICTION", "TIMEZONE", "PLACES_CONTEXT", "ROUTE_OR_TRAVEL_TIME"] as const;
export type PreciselyCapability = (typeof capabilities)[number];
export type CapabilitySummary = { capability: PreciselyCapability; available: boolean; toolName?: string; description?: string };
export type DiscoveredMcpTool = { name: string; description?: string; inputSchema?: Record<string, unknown> };
export type PreciselyHealth = { mode: "local" | "hosted"; connected: boolean; capabilities: CapabilitySummary[]; tools?: DiscoveredMcpTool[]; message?: string };
export type PreciselyInvocationResult = { status: "success" | "not_found" | "unavailable" | "error"; data?: unknown; message?: string; toolName?: string; actionName?: string; raw?: unknown };
export type PreciselyActionCandidate = { actionId: string; title?: string; description?: string; domain?: string };
export interface PreciselyClient { connect(): Promise<void>; health(): Promise<PreciselyHealth>; listCapabilities(): Promise<CapabilitySummary[]>; searchActions(goal: string, maxResults?: number): Promise<PreciselyActionCandidate[]>; invoke(capability: PreciselyCapability, input: unknown): Promise<PreciselyInvocationResult>; close(): Promise<void>; }
