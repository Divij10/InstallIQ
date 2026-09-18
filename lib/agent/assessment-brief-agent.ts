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
  const routeLabel = facts.serviceArea?.routeAvailable ? "driving-route miles" : "straight-line miles (fallback)";
  const area = facts.serviceArea?.inside === true
    ? `${distance?.toFixed(1) ?? "The"} ${routeLabel} from the service base and inside the configured operating area.`
    : facts.serviceArea?.inside === false
      ? `${distance?.toFixed(1) ?? "The"} ${routeLabel} from the service base and outside the configured operating area.`
      : "Operating-area eligibility could not be calculated.";
  const inventory = facts.evInfrastructure;
  const stationSignal = inventory?.enabled
    ? inventory.stations.length
      ? `${inventory.stations.length} public EV station${inventory.stations.length === 1 ? "" : "s"} were returned by the US AFDC inventory within ${inventory.searchRadiusMiles} miles.`
      : `No public EV stations were returned by the US AFDC inventory within ${inventory.searchRadiusMiles} miles.`
    : "Public EV-station inventory is not configured.";
  const nearestStation = inventory?.stations.reduce<number | undefined>((nearest, station) => {
    if (typeof station.distanceMiles !== "number") return nearest;
    return nearest === undefined ? station.distanceMiles : Math.min(nearest, station.distanceMiles);
  }, undefined);
  const evidenceScore = facts.evidenceScore;
  const limitations = [
    "Electrical capacity, utility capacity, permits, site control, and construction feasibility require a field survey.",
    ...(inventory?.unavailable ? [inventory.message ?? "Public EV-station inventory was unavailable for this run."] : []),
    ...(!facts.serviceArea?.routeAvailable ? ["Precisely route data was not returned, so the service-area decision used straight-line distance."] : []),
  ];
  return {
    headline: facts.status === "FIELD_SURVEY_REQUIRED" ? "Digital site check complete" : "Digital site check needs attention",
    summary: `${location} was ${facts.location.resolved ? "resolved through Precisely" : "not reliably resolved"}. It is ${area}`,
    siteSignals: [
      facts.location.preciselyId ? `Precisely site ID: ${facts.location.preciselyId}.` : "Precisely did not return a site ID.",
      facts.location.matchMetadata ? `Address match score: ${facts.location.matchMetadata}.` : "Address match score was not returned.",
      stationSignal,
    ],
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
      evidenceCoverage: `${evidenceScore.score} of ${evidenceScore.maxScore} weighted evidence points were returned. ${evidenceScore.factors.filter((item) => item.earned < item.weight).map((item) => item.label.toLowerCase()).join(", ") || "All configured evidence categories"} ${evidenceScore.factors.some((item) => item.earned < item.weight) ? "have missing or fallback fields" : "were fully represented"}. The index measures coverage, not site quality or readiness.`,
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
      instructions: "You are InstallIQ's evidence explanation layer for commercial EV site assessments. Use only the supplied normalized facts. Do not use outside knowledge, infer missing values, or make a recommendation that conflicts with the supplied policy status. Do not rewrite or reinterpret raw Precisely facts. Explain only their business context. Existing EV stations are nearby context only: they do not prove suitability, electrical capacity, development rights, utility approval, permit approval, pricing, or charger availability. The digital evidence coverage index is deterministic: do not change its value, weights, band, or its meaning. It measures returned data coverage only, never site quality, feasibility, approval, or readiness. State limitations clearly. Keep the summary under 70 words; return at most 4 short site signals, 4 limitations, and 3 next steps. Each explanation must be under 65 words and make its source boundary clear.",
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
