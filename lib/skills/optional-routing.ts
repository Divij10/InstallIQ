import type { LocationResult } from "@/lib/domain/assessment"; import type { PreciselyClient } from "@/lib/precisely/types";
/** Capability-driven only. InstallIQ never invents travel-time or routes. */
export async function optionalRoutingSkill(client:PreciselyClient, location:LocationResult){return client.invoke("ROUTE_OR_TRAVEL_TIME",{latitude:location.latitude,longitude:location.longitude});}
