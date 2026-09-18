import type { LocationResult, PropertyResult } from "@/lib/domain/assessment";
import { trace } from "@/lib/domain/trace";
import { asPreciselyEvidence } from "@/lib/precisely/evidence";
import type { PreciselyCapability, PreciselyClient } from "@/lib/precisely/types";
import { pickString } from "@/lib/precisely/normalization";
import type { SkillResult } from "./types";

const propertyCapabilities: PreciselyCapability[] = ["PROPERTY_ATTRIBUTES", "BUILDING_INFORMATION", "PARCEL_INFORMATION", "ROOF_ATTRIBUTES"];

/**
 * Fan out to the property actions selected by the hosted MCP catalog. Each action receives
 * the Precisely ID returned by address verification, so every enrichment refers to the same site.
 */
export async function propertyIntelligenceSkill(client: PreciselyClient, location: LocationResult): Promise<SkillResult<PropertyResult>> {
  const start = trace({ phase: "enrichment", type: "skill_started", skillName: "Property Intelligence", message: "Running property, building, parcel, and roof enrichment" });
  const input = { address: location.standardizedAddress, preciselyId: location.preciselyId };
  const results = await Promise.all(propertyCapabilities.map((capability) => client.invoke(capability, input)));
  const evidence = results.map((result, index) => asPreciselyEvidence(propertyCapabilities[index], result));
  const successful = results.filter((result) => result.status === "success").map((result) => result.data);
  const read = (keys: string[]) => successful.map((data) => pickString(data, keys)).find(Boolean);
  const data: PropertyResult = {
    propertyType: read(["landUseDescription", "propertyType", "buildingType", "occupancy"]),
    buildingArea: read(["buildingArea", "squareFootage", "footprintAreaSquareFootage"]),
    yearBuilt: read(["yearBuilt"]),
    parcelId: read(["parcelID", "apn", "parcelId"]),
    lotArea: read(["parcelArea", "lotArea", "lotSize"]),
    buildingCount: read(["numberOfBuildingsInParcel", "buildingCount"]),
    roofType: read(["roofType"]),
    roofCondition: read(["roofCondition"]),
    solarPanelArea: read(["solarPanelAreaSquareFootage"]),
    unavailable: successful.length === 0
  };
  const errors = results.filter((result) => result.status === "error");
  return {
    data,
    evidence,
    warnings: errors.length ? ["Some selected Precisely property actions did not return data for this site."] : [],
    trace: [
      start,
      trace({ phase: "enrichment", type: "skill_completed", skillName: "Property Intelligence", message: successful.length ? `${successful.length} Precisely property action${successful.length === 1 ? "" : "s"} returned data` : "No selected property action returned data", status: successful.length ? "success" : "unavailable" })
    ]
  };
}
