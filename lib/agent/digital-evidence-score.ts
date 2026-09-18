import type { DigitalEvidenceScore, EvidenceScoreFactor, EvInfrastructureResult, JurisdictionResult, LocationResult, PropertyResult, ServiceAreaResult, SiteContextResult } from "@/lib/domain/assessment";

type ScoreInputs = {
  location: LocationResult;
  property?: PropertyResult;
  jurisdiction?: JurisdictionResult;
  siteContext?: SiteContextResult;
  serviceArea?: ServiceAreaResult;
  evInfrastructure?: EvInfrastructureResult;
};

function factor(input: EvidenceScoreFactor): EvidenceScoreFactor {
  return input;
}

/**
 * A deterministic measure of how much digital evidence was returned, not how good
 * the site is. The weights deliberately never include engineering feasibility.
 */
export function calculateDigitalEvidenceScore(input: ScoreInputs): DigitalEvidenceScore {
  const { location, property, jurisdiction, siteContext, serviceArea, evInfrastructure } = input;
  const identityEarned = (location.resolved ? 15 : 0)
    + (location.standardizedAddress ? 5 : 0)
    + (typeof location.latitude === "number" && typeof location.longitude === "number" ? 5 : 0)
    + (location.preciselyId ? 5 : 0);
  const propertyEarned = (property?.buildingArea || property?.buildingCount ? 5 : 0)
    + (property?.parcelId || property?.lotArea ? 5 : 0)
    + (property?.roofType || property?.roofCondition ? 5 : 0)
    + (property?.propertyType || property?.yearBuilt ? 5 : 0);
  const jurisdictionEarned = (jurisdiction?.taxJurisdiction ? 5 : 0)
    + (jurisdiction?.ahj ? 5 : 0)
    + (siteContext?.timeZone ? 5 : 0);
  const serviceAreaEarned = (typeof serviceArea?.distanceMiles === "number" && typeof serviceArea.inside === "boolean" ? 10 : 0)
    + (serviceArea?.routeAvailable ? 10 : 0);
  const evInfrastructureEarned = evInfrastructure?.enabled && !evInfrastructure.unavailable ? 15 : 0;

  const factors: EvidenceScoreFactor[] = [
    factor({ id: "site_identity", label: "Site identity", earned: identityEarned, weight: 30, summary: identityEarned === 30 ? "Address, coordinates, and site ID were returned." : "Some address-identity fields were not returned.", evidenceSources: ["ADDRESS_VERIFY", "ADDRESS_GEOCODE"] }),
    factor({ id: "service_area", label: "Service-area context", earned: serviceAreaEarned, weight: 20, summary: serviceArea?.routeAvailable ? "Distance and driving-route evidence were returned." : serviceAreaEarned ? "Distance evidence was returned using the straight-line fallback." : "No usable distance evidence was returned.", evidenceSources: ["ROUTE_OR_TRAVEL_TIME", "SERVICE_AREA_DISTANCE"] }),
    factor({ id: "property_context", label: "Property context", earned: propertyEarned, weight: 20, summary: propertyEarned ? "Returned property observations are counted; missing fields receive no credit." : "No usable property observations were returned.", evidenceSources: ["PROPERTY_ATTRIBUTES", "BUILDING_INFORMATION", "PARCEL_INFORMATION", "ROOF_ATTRIBUTES"] }),
    factor({ id: "jurisdiction_context", label: "Jurisdiction context", earned: jurisdictionEarned, weight: 15, summary: jurisdictionEarned ? "Returned tax, AHJ, and timezone fields are counted." : "No usable jurisdiction-context fields were returned.", evidenceSources: ["TAX_JURISDICTION", "AUTHORITY_HAVING_JURISDICTION", "TIMEZONE"] }),
    factor({ id: "public_ev_context", label: "Public EV context", earned: evInfrastructureEarned, weight: 15, summary: evInfrastructureEarned ? "The AFDC public-station inventory responded; station count does not affect this score." : "The AFDC public-station inventory was not available for this run.", evidenceSources: ["EV_STATION_INVENTORY"] }),
  ];
  const score = factors.reduce((total, item) => total + item.earned, 0);
  return {
    score,
    maxScore: 100,
    band: score >= 80 ? "Strong" : score >= 50 ? "Developing" : "Limited",
    factors,
    disclaimer: "This measures returned digital evidence only. It is not a site-quality, feasibility, permitting, utility-capacity, cost, or approval score.",
  };
}
