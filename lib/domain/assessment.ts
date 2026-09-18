import { z } from "zod";
import type { Evidence } from "./evidence";
import type { AgentTraceEvent } from "./trace";
import type { AssessmentStatus } from "./status";

const clean = (max: number) => z.string().trim().min(1).max(max);
export const assessmentRequestSchema = z.object({
  requestId: z.string().trim().max(80).optional(), businessName: clean(120), contactName: z.string().trim().max(100).optional().or(z.literal("")),
  email: z.string().trim().email().max(254).optional().or(z.literal("")), phone: z.string().trim().max(40).optional().or(z.literal("")),
  rawAddress: clean(240), chargerType: z.enum(["LEVEL_2", "DC_FAST", "UNKNOWN"]), chargerCount: z.coerce.number().int().min(1).max(100), notes: z.string().trim().max(1000).optional()
});
export type AssessmentRequest = z.infer<typeof assessmentRequestSchema>;
export type ContactResult = { name: string; nameStatus: string; emailStatus: string; phoneStatus: string; warnings: string[] };
export type LocationResult = { submittedAddress: string; standardizedAddress?: string; latitude?: number; longitude?: number; matchMetadata?: string; preciselyId?: string; parcelReference?: string; elevation?: string; resolved: boolean };
export type PropertyResult = { propertyType?: string; buildingArea?: string; yearBuilt?: string; parcelId?: string; lotArea?: string; buildingCount?: string; roofType?: string; roofCondition?: string; solarPanelArea?: string; unavailable?: boolean };
export type JurisdictionResult = { taxJurisdiction?: string; ahj?: string; disclaimer: string; unavailable?: boolean };
export type SiteContextResult = { timeZone?: string; places?: string[]; unavailable?: boolean };
export type ServiceAreaResult = { enabled: boolean; inside?: boolean; distanceMiles?: number; straightLineMiles?: number; thresholdMiles?: number; routeDistanceMiles?: number; travelMinutes?: number; routeAvailable?: boolean };
export type EvStation = { id: number; name: string; address?: string; latitude?: number; longitude?: number; network?: string; distanceMiles?: number; status?: string; access?: string; dcFastPorts?: number; level2Ports?: number; connectorTypes?: string[]; lastConfirmed?: string };
export type EvInfrastructureResult = { enabled: boolean; searchRadiusMiles: number; stations: EvStation[]; lastUpdated?: string; unavailable?: boolean; message?: string };
export type EvidenceScoreFactor = { id: "site_identity" | "service_area" | "property_context" | "jurisdiction_context" | "public_ev_context"; label: string; earned: number; weight: number; summary: string; evidenceSources: string[] };
export type DigitalEvidenceScore = { score: number; maxScore: 100; band: "Limited" | "Developing" | "Strong"; factors: EvidenceScoreFactor[]; disclaimer: string };
export type AssessmentExplanations = { serviceArea: string; evInfrastructure: string; evidenceCoverage: string; fieldSurvey: string };
export type AssessmentBrief = { headline: string; summary: string; nextSteps: string[]; siteSignals: string[]; dataLimitations: string[]; explanations: AssessmentExplanations; source: "rules" | "openai" };
export type AssessmentResult = { status: AssessmentStatus; explanation: string; nextAction: string; businessName: string; chargerType: "LEVEL_2" | "DC_FAST" | "UNKNOWN"; chargerCount: number; contact: ContactResult; location: LocationResult; property?: PropertyResult; jurisdiction?: JurisdictionResult; siteContext?: SiteContextResult; serviceArea?: ServiceAreaResult; evInfrastructure?: EvInfrastructureResult; evidenceScore: DigitalEvidenceScore; brief: AssessmentBrief; gaps: string[]; warnings: string[]; evidence: Evidence[]; trace: AgentTraceEvent[]; mode: "local" | "hosted" };
