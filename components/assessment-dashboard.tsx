import type { AssessmentResult } from "@/lib/domain/assessment";
import { AgentActivity } from "./agent-activity";
import { AssessmentRail } from "./assessment-rail";
import { DetailedSiteReport } from "./detailed-site-report";
import { RawEvidenceDrawer } from "./raw-evidence-drawer";

function squareFeet(value?: string) {
  if (!value || value === "-1" || value === "-1.0") return "Not reported";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft` : value;
}

function nearestStation(result: AssessmentResult) {
  const distances = result.evInfrastructure?.stations.flatMap((station) => typeof station.distanceMiles === "number" ? [station.distanceMiles] : []) ?? [];
  return distances.length ? `${Math.min(...distances).toFixed(1)} mi` : "Not reported";
}

function DecisionStrip({ result }: { result: AssessmentResult }) {
  const service = result.serviceArea;
  const metric = service?.routeAvailable ? `${service.routeDistanceMiles?.toFixed(1) ?? "—"} mi driving route` : `${service?.straightLineMiles?.toFixed(1) ?? "—"} mi straight-line fallback`;
  return <section className="decision-strip" aria-label="Decision"><div><b>{service?.inside ? "Inside service area" : service?.inside === false ? "Outside service area" : "Service area not reported"}</b><i>·</i><b>{metric}</b><i>·</i><b>{result.status.replaceAll("_", " ")}</b></div><p>{service?.routeAvailable ? "Precisely returned a driving route, which InstallIQ used for its operating-area calculation." : "Precisely routing did not return a usable route, so InstallIQ used the visible straight-line fallback for its operating-area calculation."}</p></section>;
}

function KeyFacts({ result }: { result: AssessmentResult }) {
  return <section className="key-facts" aria-label="Key facts"><div className="report-section-heading"><div className="eyebrow">KEY FACTS</div><h3>Key facts</h3></div><dl><div><dt>Building footprint</dt><dd>{squareFeet(result.property?.buildingArea)}</dd></div><div><dt>Parcel area</dt><dd>{squareFeet(result.property?.lotArea)}</dd></div><div><dt>Roof type</dt><dd>{result.property?.roofType ?? "Not reported"}</dd></div><div><dt>AHJ</dt><dd>{result.jurisdiction?.ahj ?? "Not reported"}</dd></div><div><dt>Nearest public charger</dt><dd>{nearestStation(result)}</dd></div></dl></section>;
}

function AssessmentLimits({ result }: { result: AssessmentResult }) {
  const routeLimit = result.serviceArea?.routeAvailable ? "Route distance is an operating-area metric, not a finding about site access, construction, or electrical feasibility." : "Precisely routing was unavailable, so the operating-area result uses a straight-line distance fallback rather than drive time.";
  const evLimit = result.evInfrastructure?.enabled && !result.evInfrastructure.unavailable ? "Nearby public stations are local context only; they do not establish site capacity, ownership, charger availability, or the need for new equipment." : "Public EV-station inventory was not returned for this run.";
  return <section className="assessment-limits" id="assessment-limits" aria-label="Assessment limits"><div className="report-section-heading"><div className="eyebrow">ASSESSMENT LIMITS</div><h3>Assessment limits</h3></div><ul><li>{routeLimit}</li><li>{evLimit}</li><li>{result.gaps.slice(0, 4).join(", ")}, and the remaining field-survey checks require site access and engineering judgement.</li></ul></section>;
}

export function AssessmentDashboard({ result, onCheckAnother }: { result: AssessmentResult; onCheckAnother: () => void }) {
  return <div className="assessment-layout" aria-live="polite">
    <AssessmentRail result={result} onCheckAnother={onCheckAnother} />
    <main className="assessment-content">
      <DecisionStrip result={result} />
      <KeyFacts result={result} />
      <DetailedSiteReport result={result} />
      <AssessmentLimits result={result} />
      {result.warnings.length > 0 && <section className="assessment-notes"><div className="eyebrow">ASSESSMENT NOTES</div>{result.warnings.map((warning) => <p key={warning}>{warning}</p>)}</section>}
      <details className="technical-drawer"><summary>Technical activity and source evidence</summary><p>Inspect the exact action flow and normalized source records.</p><AgentActivity events={result.trace} /><RawEvidenceDrawer evidence={result.evidence} /></details>
    </main>
  </div>;
}
