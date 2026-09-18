import type { JurisdictionResult, LocationResult } from "@/lib/domain/assessment";
import { trace } from "@/lib/domain/trace";
import { asPreciselyEvidence } from "@/lib/precisely/evidence";
import type { PreciselyClient } from "@/lib/precisely/types";
import { pickString } from "@/lib/precisely/normalization";
import type { SkillResult } from "./types";

export async function jurisdictionContextSkill(client: PreciselyClient, location: LocationResult): Promise<SkillResult<JurisdictionResult>> {
  const [tax, ahj] = await Promise.all([
    client.invoke("TAX_JURISDICTION", { address: location.standardizedAddress, latitude: location.latitude, longitude: location.longitude }),
    client.invoke("AUTHORITY_HAVING_JURISDICTION", { address: location.standardizedAddress, latitude: location.latitude, longitude: location.longitude })
  ]);

  return {
    data: {
      // Prefer city/place fields. A generic `name` returned the state code (AZ) before Tempe.
      taxJurisdiction: pickString(tax.data, ["taxJurisdiction", "placeName", "cityName", "city"]),
      ahj: pickString(ahj.data, ["ahj", "authority", "emergencyServices", "agency", "name"]),
      disclaimer: "Jurisdictional location context is not the same as a permit determination.",
      unavailable: tax.status !== "success" && ahj.status !== "success"
    },
    evidence: [asPreciselyEvidence("TAX_JURISDICTION", tax), asPreciselyEvidence("AUTHORITY_HAVING_JURISDICTION", ahj)],
    warnings: tax.status === "error" || ahj.status === "error" ? ["Some jurisdiction context could not be retrieved."] : [],
    trace: [
      trace({ phase: "enrichment", type: "skill_started", skillName: "Jurisdiction Context", message: "Resolving location jurisdiction and AHJ context" }),
      trace({ phase: "enrichment", type: "skill_completed", skillName: "Jurisdiction Context", message: "Jurisdiction context completed" })
    ]
  };
}
