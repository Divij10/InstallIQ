import type { AssessmentRequest, AssessmentResult } from "@/lib/domain/assessment";
import type { PreciselyClient } from "@/lib/precisely/types";
import { contactValidationSkill } from "@/lib/skills/contact-validation";
import { addressResolutionSkill } from "@/lib/skills/address-resolution";
import { propertyIntelligenceSkill } from "@/lib/skills/property-intelligence";
import { jurisdictionContextSkill } from "@/lib/skills/jurisdiction-context";
import { siteContextSkill } from "@/lib/skills/site-context";
import { serviceAreaSkill } from "@/lib/skills/service-area";
import { evStationInventorySkill } from "@/lib/skills/ev-station-inventory";
import { evaluatePolicy } from "./policy";
import { nextActionFor } from "./explanation";
import { trace } from "@/lib/domain/trace";
import { assessmentBriefAgent } from "./assessment-brief-agent";
import { calculateDigitalEvidenceScore } from "./digital-evidence-score";

const gaps = ["Electrical service capacity", "Switchgear/panel capacity", "Transformer capacity", "Existing electrical load", "Physical conduit/path availability", "Charger placement and parking-layout constraints", "Trenching requirements", "ADA/accessibility design requirements", "Utility interconnection requirements", "Site-specific permitting requirements", "Final installation cost", "Structural/physical obstructions"];

export class SiteReadinessAgent {
  constructor(private client: PreciselyClient, private mode: "local" | "hosted") {}

  async run(request: AssessmentRequest): Promise<AssessmentResult> {
    const evidence: AssessmentResult["evidence"] = [];
    const events = [trace({ phase: "request", type: "observation", message: "Request received" })];
    const warnings: string[] = [];
    const contact = await contactValidationSkill(this.client, request);
    evidence.push(...contact.evidence); events.push(...contact.trace); warnings.push(...contact.warnings);
    events.push(trace({ phase: "policy", type: "decision", message: "Contact validation does not block location processing." }));
    const location = await addressResolutionSkill(this.client, request);
    evidence.push(...location.evidence); events.push(...location.trace); warnings.push(...location.warnings);

    if (!location.data.resolved) {
      const status = "ADDRESS_CORRECTION_REQUIRED" as const;
      const next = nextActionFor(status);
      const evidenceScore = calculateDigitalEvidenceScore({ location: location.data });
      events.push(trace({ phase: "policy", type: "decision", message: `Digital evidence coverage calculated: ${evidenceScore.score}/${evidenceScore.maxScore}` }));
      events.push(trace({ phase: "policy", type: "completed", message: "Assessment policy evaluated: address correction required", status }));
      const brief = await assessmentBriefAgent({ status, location: location.data, evidenceScore, nextAction: next.nextAction, gaps });
      return { status, ...next, businessName: request.businessName, evidenceScore, brief, contact: contact.data, location: location.data, gaps, warnings, evidence, trace: events, mode: this.mode };
    }

    events.push(trace({ phase: "policy", type: "decision", message: "Site resolved; independent enrichment skills are now eligible." }));
    const [property, jurisdiction, siteContext, serviceArea, evInfrastructure] = await Promise.all([
      propertyIntelligenceSkill(this.client, location.data),
      jurisdictionContextSkill(this.client, location.data),
      siteContextSkill(this.client, location.data),
      serviceAreaSkill(this.client, location.data),
      evStationInventorySkill(location.data)
    ]);
    for (const result of [property, jurisdiction, siteContext, serviceArea, evInfrastructure]) { evidence.push(...result.evidence); events.push(...result.trace); warnings.push(...result.warnings); }
    const status = evaluatePolicy({ resolved: true, outside: serviceArea.data.inside === false, propertyError: property.evidence.some((item) => item.status === "error"), jurisdictionError: jurisdiction.evidence.some((item) => item.status === "error") });
    const next = nextActionFor(status);
    const evidenceScore = calculateDigitalEvidenceScore({ location: location.data, property: property.data, jurisdiction: jurisdiction.data, siteContext: siteContext.data, serviceArea: serviceArea.data, evInfrastructure: evInfrastructure.data });
    events.push(trace({ phase: "policy", type: "decision", message: `Digital evidence coverage calculated: ${evidenceScore.score}/${evidenceScore.maxScore}` }));
    events.push(trace({ phase: "policy", type: "completed", message: `Assessment policy evaluated: ${status.replaceAll("_", " ")}`, status }));
    const brief = await assessmentBriefAgent({ status, location: location.data, property: property.data, jurisdiction: jurisdiction.data, siteContext: siteContext.data, serviceArea: serviceArea.data, evInfrastructure: evInfrastructure.data, evidenceScore, nextAction: next.nextAction, gaps });
    return { status, ...next, businessName: request.businessName, evidenceScore, brief, contact: contact.data, location: location.data, property: property.data, jurisdiction: jurisdiction.data, siteContext: siteContext.data, serviceArea: serviceArea.data, evInfrastructure: evInfrastructure.data, gaps, warnings, evidence, trace: events, mode: this.mode };
  }
}
