import type { AssessmentResult } from "@/lib/domain/assessment";
import type { Evidence } from "@/lib/domain/evidence";
import { AgentActivity } from "./agent-activity";
import { DetailedSiteReport } from "./detailed-site-report";
import { DigitalEvidenceCoverage } from "./digital-evidence-coverage";
import { EvidenceExplanationPanels } from "./evidence-explanation-panels";
import { RawEvidenceDrawer } from "./raw-evidence-drawer";
import { SiteMap } from "./site-map";
import { SiteStatsBento } from "./site-stats-bento";
import { StatusBanner } from "./status-banner";

const friendlyCapability: Record<string, string> = {
  ADDRESS_VERIFY: "Address verification",
  ADDRESS_GEOCODE: "Coordinate lookup",
  TAX_JURISDICTION: "Tax jurisdiction",
  AUTHORITY_HAVING_JURISDICTION: "AHJ / emergency context",
  TIMEZONE: "Timezone",
  PLACES_CONTEXT: "Nearby places",
  PROPERTY_ATTRIBUTES: "Property structure",
  BUILDING_INFORMATION: "Building information",
  PARCEL_INFORMATION: "Parcel information",
  ROOF_ATTRIBUTES: "Roof attributes",
  ROUTE_OR_TRAVEL_TIME: "Route context",
  CONTACT_NAME_PARSE: "Name check",
  CONTACT_EMAIL_VERIFY: "Email check",
  CONTACT_PHONE_VALIDATE: "Phone check"
};

function CapabilityCoverage({ evidence }: { evidence: Evidence[] }) {
  const precisely = evidence.filter((item) => item.source.provider === "Precisely");
  const confirmed = precisely.filter((item) => item.status === "success");
  const unavailable = precisely.filter((item) => item.status === "unavailable");
  const notRequested = precisely.filter((item) => item.status === "not_requested");
  const attention = precisely.filter((item) => item.status === "error" || item.status === "not_found");
  return (
    <section className="coverage-card" aria-label="Precisely data coverage">
      <div className="section-heading">
        <div>
          <div className="eyebrow">PRECISELY MCP COVERAGE</div>
          <h3>What the connected catalog delivered</h3>
        </div>
        <span className="coverage-count">{confirmed.length} verified</span>
      </div>
      <dl className="coverage-metrics">
        <div>
          <dt>{confirmed.length}</dt>
          <dd>returned facts</dd>
        </div>
        <div>
          <dt>{unavailable.length}</dt>
          <dd>not in this catalog</dd>
        </div>
        <div>
          <dt>{attention.length}</dt>
          <dd>needs attention</dd>
        </div>
      </dl>
      <div className="capability-groups">
        <div>
          <b className="capability-label good">Returned</b>
          <p>{confirmed.length ? confirmed.map((item) => friendlyCapability[item.source.capability] ?? item.source.capability).join(" · ") : "No live facts returned."}</p>
        </div>
        {unavailable.length > 0 && (
          <div>
            <b className="capability-label muted">Not connected</b>
            <p>{unavailable.map((item) => friendlyCapability[item.source.capability] ?? item.source.capability).join(" · ")}</p>
          </div>
        )}
        {notRequested.length > 0 && (
          <div>
            <b className="capability-label muted">Not requested</b>
            <p>{notRequested.map((item) => friendlyCapability[item.source.capability] ?? item.source.capability).join(" · ")}</p>
          </div>
        )}
        {attention.length > 0 && (
          <div>
            <b className="capability-label attention">Needs attention</b>
            <p>{attention.map((item) => friendlyCapability[item.source.capability] ?? item.source.capability).join(" · ")}</p>
          </div>
        )}
      </div>
      <p className="coverage-note">InstallIQ asks the hosted MCP to find, describe, validate, and execute only site-relevant action contracts. It does not substitute missing property, permitting, or electrical data.</p>
    </section>
  );
}

function DecisionBrief({ result }: { result: AssessmentResult }) {
  return (
    <section className="decision-brief">
      <div className="decision-brief-main"><div><div className="eyebrow">ASSESSMENT BRIEF</div><h3>{result.brief.headline}</h3><p>{result.brief.summary}</p></div><aside className="brief-next" aria-label="Next step"><b>NEXT STEP</b><strong>{result.nextAction}</strong><small>{result.brief.source === "openai" ? "AI explanation grounded in normalized source evidence" : "Rules-based explanation grounded in normalized source evidence"}</small></aside></div>
      <div className="brief-insights"><div><b>Verified signals</b><ul>{result.brief.siteSignals.map((signal) => <li key={signal}>{signal}</li>)}</ul></div><div><b>Limits on this assessment</b><ul>{result.brief.dataLimitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></div></div>
    </section>
  );
}

function FieldSurvey({ gaps }: { gaps: string[] }) { const firstChecks = gaps.slice(0, 6); return <section className="survey-card"><div className="section-heading"><div><div className="eyebrow">FIELD SURVEY PLAN</div><h3>What people must still confirm</h3></div><span>Never inferred digitally</span></div><div className="survey-checks">{firstChecks.map((gap) => <div key={gap}><i>✓</i>{gap}</div>)}</div><details><summary>See all {gaps.length} field-survey checks</summary><ul>{gaps.slice(6).map((gap) => <li key={gap}>{gap}</li>)}</ul></details></section>; }

export function AssessmentDashboard({ result }: { result: AssessmentResult }) {
  return <div className="results readable-results" aria-live="polite">
    <StatusBanner result={result} />
    <SiteMap result={result} />
    <section className="assessment-summary" aria-label="Assessment summary"><SiteStatsBento result={result} /><DecisionBrief result={result} /><DigitalEvidenceCoverage result={result} /></section>
    <EvidenceExplanationPanels result={result} />
    <section className="site-dossier"><DetailedSiteReport result={result} /><FieldSurvey gaps={result.gaps} /></section>
    {result.warnings.length > 0 && <section className="warnings"><b>Assessment notes</b>{result.warnings.map((warning) => <p key={warning}>{warning}</p>)}</section>}
    <details className="technical-drawer"><summary>View Precisely MCP activity and source evidence</summary><p>Use this audit trail to see which actions the routing layer discovered, described, validated, and executed, then inspect the normalized source evidence.</p><CapabilityCoverage evidence={result.evidence} /><AgentActivity events={result.trace} /><RawEvidenceDrawer evidence={result.evidence} /></details>
  </div>;
}
