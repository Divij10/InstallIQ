import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { env } from "@/lib/config/env";
import type { AssessmentBrief, AssessmentResult } from "@/lib/domain/assessment";

type BriefFacts = Pick<AssessmentResult, "status" | "location" | "property" | "jurisdiction" | "siteContext" | "serviceArea" | "evInfrastructure" | "evidenceScore" | "gaps" | "nextAction">;

const narrativeSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  siteSignals: z.array(z.string()),
  dataLimitations: z.array(z.string()),
  nextSteps: z.array(z.string()),
  explanations: z.object({
    serviceArea: z.string(),
    evInfrastructure: z.string(),
    evidenceCoverage: z.string(),
    fieldSurvey: z.string(),
  }),
});

function rulesBrief(facts: BriefFacts): AssessmentBrief {
  const location = facts.location.standardizedAddress ?? facts.location.submittedAddress;
  const distance = facts.serviceArea?.distanceMiles;
  const inventory = facts.evInfrastructure;
  const stationSignal = inventory?.enabled
    ? inventory.stations.length
      ? `${inventory.stations.length} public EV station${inventory.stations.length === 1 ? "" : "s"} within ${inventory.searchRadiusMiles} miles.`
      : `No public EV stations within ${inventory.searchRadiusMiles} miles.`
    : "";
  const nearestStation = inventory?.stations.reduce<number | undefined>((nearest, station) => {
    if (typeof station.distanceMiles !== "number") return nearest;
    return nearest === undefined ? station.distanceMiles : Math.min(nearest, station.distanceMiles);
  }, undefined);
  const limitations = [
    "Electrical capacity, utility capacity, permits, site control, and construction feasibility require a field survey.",
    ...(inventory?.unavailable ? [inventory.message ?? "Public EV-station inventory was unavailable for this run."] : []),
    ...(!facts.serviceArea?.routeAvailable ? ["Precisely route data was not returned, so the service-area decision used straight-line distance."] : []),
  ];
  const city = location.split(",")[1]?.trim() ?? location;
  const areaPhrase = facts.serviceArea?.inside === true
    ? `inside the ${facts.serviceArea.thresholdMiles}-mile service area`
    : facts.serviceArea?.inside === false
      ? `outside the ${facts.serviceArea.thresholdMiles}-mile service area`
      : "service-area eligibility not established";
  const travelPhrase = facts.serviceArea?.travelMinutes
    ? `, about ${Math.round(facts.serviceArea.travelMinutes)} minutes by road`
    : "";
  const opinion = facts.status === "FIELD_SURVEY_REQUIRED"
    ? facts.serviceArea?.inside && facts.evInfrastructure?.stations.length === 0
      ? "Good candidate — within reach and no public charging nearby yet"
      : facts.serviceArea?.inside
        ? "Looks like a solid opportunity — worth sending a team out"
        : "Eligible for survey — confirm the details on the ground"
    : facts.status === "OUTSIDE_SERVICE_AREA"
      ? "Outside our coverage — not worth dispatching without a partner"
      : facts.status === "ADDRESS_CORRECTION_REQUIRED"
        ? "Can't assess this one yet — the address didn't resolve"
        : "Hold for now — some data needs to be reviewed first";
  const reasonParts = [
    facts.serviceArea?.inside !== undefined
      ? facts.serviceArea.inside
        ? `it's ${areaPhrase}${travelPhrase}`
        : `it's ${areaPhrase}${travelPhrase}`
      : null,
    inventory?.enabled && !inventory.unavailable && inventory.stations.length === 0
      ? "there's no public charging nearby yet"
      : inventory?.enabled && !inventory.unavailable && inventory.stations.length > 0
        ? `there are already ${inventory.stations.length} public stations within ${inventory.searchRadiusMiles} miles`
        : null,
  ].filter(Boolean);
  const reasonSentence = reasonParts.length ? `${reasonParts[0]?.charAt(0).toUpperCase()}${reasonParts[0]?.slice(1)}${reasonParts[1] ? `, and ${reasonParts[1]}` : ""}. ` : "";
  const caveat = !facts.location.resolved
    ? "The address couldn't be verified, so take these findings with caution."
    : !facts.serviceArea?.routeAvailable
      ? "Route distance is estimated — actual drive time needs confirmation."
      : "";
  return {
    headline: opinion,
    summary: `${opinion.split(" — ")[0] === "Looks like a solid opportunity" ? "This looks like a solid opportunity." : `${opinion}.`} ${reasonSentence}${caveat}`.trim(),
    siteSignals: [
      facts.serviceArea?.inside !== undefined
        ? `${facts.serviceArea.inside ? "Inside" : "Outside"} service area · ${distance !== undefined ? `${distance.toFixed(1)} mi ${facts.serviceArea.routeAvailable ? "by road" : "straight-line"}` : "distance not reported"}`
        : "Service area not established",
      facts.evInfrastructure?.enabled && !facts.evInfrastructure.unavailable
        ? `${facts.evInfrastructure.stations.length} public EV station${facts.evInfrastructure.stations.length === 1 ? "" : "s"} within ${facts.evInfrastructure.searchRadiusMiles} miles`
        : "Public EV station data unavailable",
      facts.property?.buildingArea && facts.property.buildingArea !== "-1"
        ? `${Number(facts.property.buildingArea).toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft building`
        : facts.jurisdiction?.ahj
          ? `${facts.jurisdiction.ahj} AHJ`
          : "Property data not reported",
    ].filter(Boolean),
    dataLimitations: limitations,
    nextSteps: [facts.nextAction, "Confirm electrical capacity and physical routing during the field survey."],
    explanations: {
      serviceArea: facts.serviceArea?.routeAvailable
        ? `InstallIQ used the Precisely driving-route result of ${facts.serviceArea.routeDistanceMiles?.toFixed(1) ?? "the returned"} miles for its ${facts.serviceArea.inside ? "inside-area" : "outside-area"} policy check. This is a service-distance calculation, not a construction or electrical-feasibility finding.`
        : typeof facts.serviceArea?.straightLineMiles === "number"
          ? `Precisely routing did not return a usable route, so InstallIQ used a visible ${facts.serviceArea.straightLineMiles.toFixed(1)}-mile straight-line fallback for its service-area policy. Drive time and real road conditions were not established.`
          : "InstallIQ could not calculate the service-area distance for this run.",
      evInfrastructure: inventory?.enabled && !inventory.unavailable
        ? `${inventory.stations.length} public EV station${inventory.stations.length === 1 ? " was" : "s were"} returned by the AFDC inventory within ${inventory.searchRadiusMiles} miles${nearestStation !== undefined ? `; the nearest reported distance is ${nearestStation.toFixed(1)} miles` : ""}. Nearby stations describe local public infrastructure only; they do not confirm on-site capacity, ownership, availability, or a need for new chargers.`
        : inventory?.message ?? "Public EV-station context was not returned for this run.",
      evidenceCoverage: `${facts.evidenceScore.score} of ${facts.evidenceScore.maxScore} weighted evidence points were returned. ${facts.evidenceScore.factors.filter((item) => item.earned < item.weight).map((item) => item.label.toLowerCase()).join(", ") || "All configured evidence categories"} ${facts.evidenceScore.factors.some((item) => item.earned < item.weight) ? "have missing or fallback fields" : "were fully represented"}. The index measures coverage, not site quality or readiness.`,
      fieldSurvey: `The digital record cannot verify ${facts.gaps.slice(0, 4).map((gap) => gap.toLowerCase()).join(", ")}, or the other field-survey checks. Those require people, site access, and engineering judgement; no digital result changes that requirement.`,
    },
    source: "rules",
  };
}

/**
 * Non-authoritative explanation layer. It only receives normalized facts and cannot
 * call tools, change policy, or infer engineering, permit, utility, cost, ownership,
 * or charger-availability facts that are not in those inputs.
 */
export async function assessmentBriefAgent(facts: BriefFacts): Promise<AssessmentBrief> {
  const fallback = rulesBrief(facts);
  if (!env.OPENAI_API_KEY) return fallback;

  try {
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await client.responses.parse({
      model: env.OPENAI_MODEL,
      store: false,
      instructions: "You are a straight-talking EV installation consultant reviewing a site assessment. Give your honest opinion — lead with whether this site is worth pursuing and why, based only on the supplied facts. Sound like a knowledgeable colleague giving their read, not a system report.\n\nFor the headline: one punchy opinion, e.g. 'Strong candidate — easy reach, large site' or 'Worth a look, but check the distance'.\n\nFor the summary: 2–3 sentences. Open with your take ('This looks like a solid opportunity…' / 'I'd be cautious here…' / 'Good candidate — …'). Then back it with 1–2 reasons from the data (service area, travel time, building size, EV density nearby). End with one honest caveat or limitation. Do NOT list data points — give a reasoned opinion. Under 65 words. Never mention status codes.\n\nFor siteSignals: 3–4 short evidence chips that support your opinion. Plain English only — e.g. '12 min from base', 'Large commercial building', '12 nearby public stations', 'Maricopa County AHJ'. No raw IDs, no technical codes.\n\nFor dataLimitations: plain sentences, under 4 items.\nFor nextSteps: action-oriented, under 3 items.\nFor explanations: clear, under 65 words each, state the data source boundary.",
      input: JSON.stringify({
        policyStatus: facts.status,
        nextAction: facts.nextAction,
        siteIdentity: { standardizedAddress: facts.location.standardizedAddress ?? facts.location.submittedAddress, resolved: facts.location.resolved, matchScore: facts.location.matchMetadata, preciselyId: facts.location.preciselyId },
        serviceArea: facts.serviceArea,
        installIqServicePolicy: { status: facts.status, nextAction: facts.nextAction },
        propertyContext: facts.property,
        jurisdiction: facts.jurisdiction,
        siteContext: facts.siteContext,
        publicEvInfrastructure: facts.evInfrastructure ? { source: "US Alternative Fuels Data Center (AFDC)", enabled: facts.evInfrastructure.enabled, searchRadiusMiles: facts.evInfrastructure.searchRadiusMiles, unavailable: facts.evInfrastructure.unavailable, message: facts.evInfrastructure.message, stations: facts.evInfrastructure.stations.slice(0, 3) } : undefined,
        deterministicDigitalEvidenceCoverage: facts.evidenceScore,
        fieldSurveyRequirements: facts.gaps.slice(0, 6),
      }),
      text: { format: zodTextFormat(narrativeSchema, "installiq_site_narrative") },
    });
    const parsed = response.output_parsed;
    if (!parsed) return fallback;
    return { headline: parsed.headline, summary: parsed.summary, siteSignals: parsed.siteSignals.slice(0, 4), dataLimitations: parsed.dataLimitations.slice(0, 4), nextSteps: parsed.nextSteps.slice(0, 3), explanations: parsed.explanations, source: "openai" };
  } catch {
    return fallback;
  }
}
