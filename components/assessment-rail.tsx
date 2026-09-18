import type { AssessmentResult } from "@/lib/domain/assessment";
import { SiteMap } from "./site-map";

function missingCoverage(result: AssessmentResult) {
  const missing = result.evidenceScore.factors.filter((factor) => factor.earned < factor.weight).map((factor) => factor.label.toLowerCase());
  return missing.length ? `Missing or partial: ${missing.join(", ")}.` : "All configured evidence categories returned.";
}

export function AssessmentRail({ result, onCheckAnother }: { result: AssessmentResult; onCheckAnother: () => void }) {
  const address = result.location.standardizedAddress ?? result.location.submittedAddress;
  return (
    <aside className="assessment-rail" aria-label="Assessment summary">
      <div className="rail-identity">
        <div className="eyebrow">SITE ASSESSMENT</div>
        <h2 title={address}>{address}</h2>
        <dl>
          <div><dt>Precisely ID</dt><dd>{result.location.preciselyId ?? "Not reported"}</dd></div>
          <div><dt>Match score</dt><dd>{result.location.matchMetadata ?? "Not reported"}</dd></div>
        </dl>
      </div>
      <div className={`rail-status ${result.status.toLowerCase()}`}>{result.status.replaceAll("_", " ")}</div>
      <div className="rail-coverage">
        <span>Evidence coverage</span>
        <strong>{result.evidenceScore.score}<small>/{result.evidenceScore.maxScore}</small></strong>
        <p>{missingCoverage(result)}</p>
      </div>
      <button className="primary rail-action" type="button" onClick={() => document.getElementById("assessment-limits")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Schedule field survey</button>
      <SiteMap result={result} compact />
      <button className="rail-secondary" type="button" onClick={onCheckAnother}>Check another site</button>
    </aside>
  );
}
