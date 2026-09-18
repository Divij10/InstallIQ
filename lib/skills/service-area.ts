import type { LocationResult, ServiceAreaResult } from "@/lib/domain/assessment";
import { trace } from "@/lib/domain/trace";
import { evidence } from "@/lib/domain/evidence";
import { env } from "@/lib/config/env";
import { haversineMiles } from "@/lib/config/service-area";
import { asPreciselyEvidence } from "@/lib/precisely/evidence";
import { pickString } from "@/lib/precisely/normalization";
import type { PreciselyClient } from "@/lib/precisely/types";
import type { SkillResult } from "./types";

function asRouteMiles(value?: string) { const meters = Number(value); return Number.isFinite(meters) ? meters / 1609.344 : undefined; }
function asTravelMinutes(value?: string) { const seconds = Number(value); return Number.isFinite(seconds) ? seconds / 60 : undefined; }

/** Uses Precisely routing for service distance, keeping Haversine only as a transparent fallback. */
export async function serviceAreaSkill(client: PreciselyClient, location: LocationResult): Promise<SkillResult<ServiceAreaResult>> {
  const skillName = "Service Area";
  const threshold = Number(env.SERVICE_RADIUS_MILES);
  const started = trace({ phase: "enrichment", type: "skill_started", skillName, message: "Starting traffic-aware service-area check" });
  if (typeof location.latitude !== "number" || typeof location.longitude !== "number") return { data: { enabled: true, thresholdMiles: threshold }, evidence: [evidence({ status: "not_found", source: { provider: "InstallIQ", capability: "SERVICE_AREA_DISTANCE" }, message: "Location missing coordinates", rawAvailable: false })], warnings: [], trace: [started, trace({ phase: "enrichment", type: "skill_completed", skillName, message: "Service-area check completed (no coordinates)" })] };

  const straightLineMiles = haversineMiles(env.SERVICE_BASE_LATITUDE, env.SERVICE_BASE_LONGITUDE, location.latitude, location.longitude);
  const route = await client.invoke("ROUTE_OR_TRAVEL_TIME", { origin: `${env.SERVICE_BASE_LATITUDE},${env.SERVICE_BASE_LONGITUDE}`, destination: `${location.latitude},${location.longitude}`, mode: "car", geometry: "geojson", route_type: "fastest" });
  const routeDistanceMiles = asRouteMiles(pickString(route.data, ["distance", "distanceMeters", "length"]));
  const travelMinutes = asTravelMinutes(pickString(route.data, ["duration", "durationSeconds", "travelTime"]));
  const routeAvailable = route.status === "success" && routeDistanceMiles !== undefined;
  const distanceMiles = routeAvailable ? routeDistanceMiles : straightLineMiles;
  const inside = distanceMiles <= threshold;
  return {
    data: { enabled: true, inside, distanceMiles, straightLineMiles, thresholdMiles: threshold, routeDistanceMiles, travelMinutes, routeAvailable },
    evidence: [asPreciselyEvidence("ROUTE_OR_TRAVEL_TIME", route), evidence({ status: "success", source: { provider: "InstallIQ", capability: "SERVICE_AREA_DISTANCE" }, data: { straightLineMiles, thresholdMiles: threshold }, message: "Straight-line distance retained as a routing fallback and geographic reference.", rawAvailable: false })],
    warnings: routeAvailable ? [] : ["Precisely route context was unavailable; the operating-area decision used straight-line distance as a fallback."],
    trace: [started, trace({ phase: "enrichment", type: "tool_called", skillName, message: "Precisely MCP → traffic-aware driving route" }), trace({ phase: "enrichment", type: "skill_completed", skillName, message: routeAvailable ? `Precisely route: ${routeDistanceMiles.toFixed(1)} miles${travelMinutes ? `, ${Math.round(travelMinutes)} minutes` : ""}` : `Route unavailable; fallback distance: ${straightLineMiles.toFixed(1)} miles`, status: routeAvailable ? "success" : "unavailable" })]
  };
}
