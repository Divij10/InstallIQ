import { env } from "@/lib/config/env";
import type { EvInfrastructureResult, EvStation, LocationResult } from "@/lib/domain/assessment";
import { evidence } from "@/lib/domain/evidence";
import { trace } from "@/lib/domain/trace";
import type { SkillResult } from "./types";

type AfdcStation = {
  id?: number;
  station_name?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip?: string;
  ev_network?: string;
  distance?: number;
  status_code?: string;
  access_code?: string;
  ev_dc_fast_num?: number;
  ev_level2_evse_num?: number;
  ev_connector_types?: string[];
  date_last_confirmed?: string;
};

type AfdcResponse = { fuel_stations?: AfdcStation[]; station_counts?: unknown };

function stationAddress(station: AfdcStation) {
  return [station.street_address, station.city, station.state, station.zip].filter(Boolean).join(", ") || undefined;
}

function normalizeStation(station: AfdcStation): EvStation | undefined {
  if (typeof station.id !== "number" || !station.station_name) return undefined;
  return {
    id: station.id,
    name: station.station_name,
    address: stationAddress(station),
    network: station.ev_network,
    distanceMiles: typeof station.distance === "number" ? station.distance : undefined,
    status: station.status_code,
    access: station.access_code,
    dcFastPorts: typeof station.ev_dc_fast_num === "number" ? station.ev_dc_fast_num : undefined,
    level2Ports: typeof station.ev_level2_evse_num === "number" ? station.ev_level2_evse_num : undefined,
    connectorTypes: Array.isArray(station.ev_connector_types) ? station.ev_connector_types : undefined,
    lastConfirmed: station.date_last_confirmed,
  };
}

/** Public U.S./Canada charger context. This never changes engineering or service-area policy. */
export async function evStationInventorySkill(location: LocationResult): Promise<SkillResult<EvInfrastructureResult>> {
  const skillName = "EV Infrastructure Context";
  const radius = env.EV_STATION_SEARCH_RADIUS_MILES;
  const started = trace({ phase: "enrichment", type: "skill_started", skillName, message: "Checking public EV charging inventory" });
  const base: EvInfrastructureResult = { enabled: Boolean(env.NREL_API_KEY), searchRadiusMiles: radius, stations: [] };
  if (!env.NREL_API_KEY) {
    const message = "AFDC public EV-station inventory is not configured.";
    return { data: { ...base, unavailable: true, message }, evidence: [evidence({ status: "unavailable", source: { provider: "AFDC", transport: "https", capability: "EV_STATION_INVENTORY" }, message, rawAvailable: false })], warnings: [], trace: [started, trace({ phase: "enrichment", type: "skill_completed", skillName, message, status: "unavailable" })] };
  }
  if (location.latitude === undefined || location.longitude === undefined) {
    const message = "Resolved coordinates are required for an EV-station search.";
    return { data: { ...base, message }, evidence: [evidence({ status: "not_found", source: { provider: "AFDC", transport: "https", capability: "EV_STATION_INVENTORY" }, message, rawAvailable: false })], warnings: [], trace: [started, trace({ phase: "enrichment", type: "skill_completed", skillName, message, status: "not_found" })] };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const query = new URLSearchParams({ api_key: env.NREL_API_KEY, fuel_type: "ELEC", latitude: String(location.latitude), longitude: String(location.longitude), radius: String(radius), limit: "12", access: "public", status: "E" });
    const response = await fetch(`https://developer.nlr.gov/api/alt-fuel-stations/v1/nearest.json?${query}`, { cache: "no-store", signal: controller.signal });
    const raw = await response.json() as AfdcResponse | { error?: string };
    if (!response.ok) throw new Error("error" in raw && raw.error ? raw.error : `AFDC returned HTTP ${response.status}.`);
    const payload = raw as AfdcResponse;
    const stations = (payload.fuel_stations ?? []).map(normalizeStation).filter((station): station is EvStation => Boolean(station));
    const message = stations.length ? `${stations.length} public EV station${stations.length === 1 ? "" : "s"} returned within ${radius} miles.` : `No public EV stations returned within ${radius} miles.`;
    const status = stations.length ? "success" : "not_found" as const;
    return { data: { ...base, enabled: true, stations, message }, evidence: [evidence({ status, source: { provider: "AFDC", transport: "https", capability: "EV_STATION_INVENTORY" }, data: { stationCount: stations.length, radiusMiles: radius }, message, rawAvailable: true, raw })], warnings: [], trace: [started, trace({ phase: "enrichment", type: "tool_called", skillName, message: "AFDC → nearby public EV stations" }), trace({ phase: "enrichment", type: "skill_completed", skillName, message, status })] };
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError" ? "AFDC EV-station request timed out." : `AFDC EV-station inventory was unavailable${error instanceof Error ? `: ${error.message}` : "."}`;
    return { data: { ...base, enabled: true, unavailable: true, message }, evidence: [evidence({ status: "error", source: { provider: "AFDC", transport: "https", capability: "EV_STATION_INVENTORY" }, message, rawAvailable: false })], warnings: [message], trace: [started, trace({ phase: "enrichment", type: "skill_completed", skillName, message, status: "error" })] };
  } finally {
    clearTimeout(timeout);
  }
}
