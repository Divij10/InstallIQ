import type { LocationResult, SiteContextResult } from "@/lib/domain/assessment";
import { trace } from "@/lib/domain/trace";
import { asPreciselyEvidence } from "@/lib/precisely/evidence";
import type { PreciselyClient } from "@/lib/precisely/types";
import { pickString } from "@/lib/precisely/normalization";
import type { SkillResult } from "./types";

export async function siteContextSkill(client: PreciselyClient, location: LocationResult): Promise<SkillResult<SiteContextResult>> {
  const tz = await client.invoke("TIMEZONE", { latitude: location.latitude, longitude: location.longitude });
  return {
    data: { timeZone: pickString(tz.data, ["timeZone", "timezone", "ianaTimeZone", "timeZoneName", "timeZoneId", "iana", "zone", "tzid", "tzName"]), unavailable: tz.status !== "success" },
    evidence: [asPreciselyEvidence("TIMEZONE", tz)],
    warnings: [],
    trace: [trace({ phase: "enrichment", type: "skill_started", skillName: "Site Context", message: "Collecting timezone context" }), trace({ phase: "enrichment", type: "skill_completed", skillName: "Site Context", message: "Optional site context completed" })],
  };
}
