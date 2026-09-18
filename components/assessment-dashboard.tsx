"use client";

import { useEffect, useState } from "react";
import type { AssessmentResult } from "@/lib/domain/assessment";
import { Activity, Building2, Database, MapPinned, RotateCcw } from "lucide-react";
import { AgentActivity } from "./agent-activity";
import { NearbyCharging, SiteRecord } from "./detailed-site-report";
import { RawEvidenceDrawer } from "./raw-evidence-drawer";
import { SiteMap, type MapFocus } from "./site-map";
import { Button } from "./ui/button";

function formatAddress(address: string): string {
  return address
    .replace(/, UNITED STATES OF AMERICA$/i, "")
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/,\s([A-Z][a-z])\s(\d)/, (_, state, digit) => `, ${state.toUpperCase()} ${digit}`);
}

type View = "overview" | "record" | "charging" | "activity";

const views: Array<{ id: View; label: string; icon: typeof MapPinned }> = [
  { id: "overview", label: "Overview", icon: MapPinned },
  { id: "record", label: "Site record", icon: Building2 },
  { id: "charging", label: "Public charging", icon: Database },
  { id: "activity", label: "Source activity", icon: Activity },
];

function display(value?: string | number) {
  return value === undefined || value === "" || value === "-1" || value === "-1.0" ? "Not reported" : String(value);
}

function squareFeet(value?: string) {
  if (!value || value === "-1" || value === "-1.0") return "Not reported";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft` : value;
}

function nearestStation(result: AssessmentResult) {
  const distances = result.evInfrastructure?.stations.flatMap((station) => typeof station.distanceMiles === "number" ? [station.distanceMiles] : []) ?? [];
  return distances.length ? `${Math.min(...distances).toFixed(1)} mi away` : "Distance not reported";
}


function FindingRow({ label, value, supporting, source }: { label: string; value: string; supporting: string; source: string }) {
  return <div className="report-finding-row"><div className="report-finding-label">{label}</div><div className="report-finding-value"><strong>{value}</strong><span>{supporting}</span></div><span className="report-finding-source">{source}</span></div>;
}

function Findings({ result }: { result: AssessmentResult }) {
  const stations = result.evInfrastructure;
  return <section className="report-findings" aria-label="Digital findings">
    <div className="report-section-title"><h2>Site findings</h2></div>
    <div className="report-finding-table">
      <FindingRow label="Site identity" value={display(result.location.preciselyId)} supporting={`Address match ${display(result.location.matchMetadata)}`} source="Precisely" />
      <FindingRow label="Property" value={squareFeet(result.property?.buildingArea)} supporting={`Parcel area ${squareFeet(result.property?.lotArea)}`} source="Precisely" />
      <FindingRow label="Local authority" value={display(result.jurisdiction?.ahj)} supporting={`Tax jurisdiction ${display(result.jurisdiction?.taxJurisdiction)}`} source="Precisely" />
      <FindingRow label="Public charging" value={stations?.enabled && !stations.unavailable ? `${stations.stations.length} stations within ${stations.searchRadiusMiles} mi` : "Not available"} supporting={stations?.enabled && !stations.unavailable ? `Nearest listed station ${nearestStation(result)}` : "Public station lookup did not return data"} source="US AFDC" />
    </div>
  </section>;
}

function NextSteps({ result }: { result: AssessmentResult }) {
  const needsSurvey = result.status === "FIELD_SURVEY_REQUIRED";
  const handoffItems = needsSurvey ? result.gaps.slice(0, 6) : result.status === "ADDRESS_CORRECTION_REQUIRED" ? ["Confirm the street address and any unit number", "Run the digital assessment again after correction"] : result.status === "OUTSIDE_SERVICE_AREA" ? ["Review the request with an out-of-area sales contact", "Confirm whether a local installation partner is needed"] : ["Inspect the source evidence for errors or conflicts", "Resolve the missing information before dispatch"];
  return <section className="report-next" id="report-next-steps" aria-label="Next steps">
    <div className="report-section-title"><h2>{needsSurvey ? "Survey plan" : "Next steps"}</h2></div>
    <div className="report-next-grid">
      <div className="report-next-intro"><p>{needsSurvey ? result.brief.explanations.fieldSurvey : result.explanation}</p></div>
      <div className="report-survey-list"><span>{needsSurvey ? "Checks to prepare" : "Handoff items"}</span><ul>{handoffItems.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>)}</ul></div>
    </div>
  </section>;
}

function ActivityView({ result }: { result: AssessmentResult }) {
  return <section className="report-activity" aria-label="Source activity"><AgentActivity events={result.trace} /><RawEvidenceDrawer evidence={result.evidence} /></section>;
}

export function AssessmentDashboard({ result, onCheckAnother }: { result: AssessmentResult; onCheckAnother: () => void }) {
  const [view, setView] = useState<View>("overview");
  const [mapFocus, setMapFocus] = useState<MapFocus>("site");
  return <div className="report-workspace" aria-live="polite">
    <header className="report-heading"><div><h1>{result.businessName}</h1><p>{formatAddress(result.location.standardizedAddress ?? result.location.submittedAddress)}</p></div><Button variant="outline" onClick={onCheckAnother}><RotateCcw size={15} /> New site</Button></header>
    <div className="report-verdict">
      <div className="report-verdict-text">
        <div className="report-verdict-lead">
          <span className={`report-verdict-dot ${result.status === "FIELD_SURVEY_REQUIRED" ? "go" : "nogo"}`} />
          <strong className="report-verdict-label">{result.status === "FIELD_SURVEY_REQUIRED" ? "Suitable for field survey" : result.status === "OUTSIDE_SERVICE_AREA" ? "Outside service area" : result.status === "ADDRESS_CORRECTION_REQUIRED" ? "Address needs correction" : "Needs data review"}</strong>
        </div>
        <p className="report-verdict-summary">{result.brief.summary}</p>
      </div>
      {result.brief.siteSignals.length > 0 && <ul className="report-verdict-signals">{result.brief.siteSignals.map((signal) => <li key={signal}>{signal}</li>)}</ul>}
    </div>
    <div className="report-hero"><SiteMap result={result} focus={mapFocus} onFocusChange={setMapFocus} /></div>
    <nav className="report-tabs" role="tablist" aria-label="Assessment views">{views.map(({ id, label, icon: Icon }) => <Button key={id} variant="ghost" role="tab" aria-selected={view === id} aria-controls={`report-panel-${id}`} className={view === id ? "active" : undefined} onClick={() => { setView(id); if (id === "charging") setMapFocus("chargers"); }}><Icon size={15} />{label}</Button>)}</nav>
    <div id={`report-panel-${view}`} role="tabpanel" className="report-panel">
      {view === "overview" && <><Findings result={result} /><NextSteps result={result} />{result.warnings.length > 0 && <div className="report-notes"><strong>Data notes</strong><ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}</>}
      {view === "record" && <SiteRecord result={result} />}
      {view === "charging" && <NearbyCharging result={result} onViewMap={() => { setMapFocus("chargers"); document.getElementById("main-site-map")?.scrollIntoView({ behavior: "smooth", block: "center" }); }} />}
      {view === "activity" && <ActivityView result={result} />}
    </div>
  </div>;
}
