import type { LocationResult, SiteContextResult } from "@/lib/domain/assessment";
import { trace } from "@/lib/domain/trace";
import { asPreciselyEvidence } from "@/lib/precisely/evidence";
import type { PreciselyClient } from "@/lib/precisely/types";
import { pickString } from "@/lib/precisely/normalization";
import type { SkillResult } from "./types";

function extractPlaceNames(value: unknown, names = new Set<string>()): string[] {
  if (Array.isArray(value)) { for (const item of value) extractPlaceNames(item, names); return [...names].slice(0, 5); }
  if (!value || typeof value !== "object") return [...names].slice(0, 5);
  const record = value as Record<string, unknown>;
  for (const key of ["formattedAddress", "placeName", "name", "displayName"]) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.length > 3 && names.size < 5) names.add(candidate);
  }
  for (const child of Object.values(record)) extractPlaceNames(child, names);
  return [...names].slice(0, 5);
}

export async function siteContextSkill(client: PreciselyClient, location: LocationResult): Promise<SkillResult<SiteContextResult>> {
  const [tz, places] = await Promise.all([
    client.invoke("TIMEZONE", { latitude: location.latitude, longitude: location.longitude }),
    client.invoke("PLACES_CONTEXT", { latitude: location.latitude, longitude: location.longitude }),
  ]);
  return {
    data: { timeZone: pickString(tz.data, ["timeZone", "timezone", "ianaTimeZone", "timeZoneName", "timeZoneId", "iana", "zone", "tzid", "tzName"]), places: places.status === "success" ? extractPlaceNames(places.data) : [], unavailable: tz.status !== "success" && places.status !== "success" },
    evidence: [asPreciselyEvidence("TIMEZONE", tz), asPreciselyEvidence("PLACES_CONTEXT", places)],
    warnings: [],
    trace: [trace({ phase: "enrichment", type: "skill_started", skillName: "Site Context", message: "Collecting timezone and nearby physical-place context" }), trace({ phase: "enrichment", type: "skill_completed", skillName: "Site Context", message: "Optional site context completed" })],
  };
}
