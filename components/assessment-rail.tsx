import type { AssessmentResult } from "@/lib/domain/assessment";
import { CalendarPlus, ChevronLeft, MapPin } from "lucide-react";
import { SiteMap } from "./site-map";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

function missingCoverage(result: AssessmentResult) {
  const missing = result.evidenceScore.factors.filter((factor) => factor.earned < factor.weight).map((factor) => factor.label.toLowerCase());
  return missing.length ? `Missing or partial: ${missing.join(", ")}.` : "All configured evidence categories returned.";
}

export function AssessmentRail({ result, onCheckAnother }: { result: AssessmentResult; onCheckAnother: () => void }) {
  const address = result.location.standardizedAddress ?? result.location.submittedAddress;
  return (
    <aside className="assessment-rail" aria-label="Assessment summary">
      <div className="rail-identity">
        <div className="rail-kicker"><MapPin size={13} strokeWidth={2} /><span>Site assessment</span></div>
        <h2 title={address}>{address}</h2>
        <dl>
          <div><dt>Precisely ID</dt><dd>{result.location.preciselyId ?? "Not reported"}</dd></div>
          <div><dt>Match score</dt><dd>{result.location.matchMetadata ?? "Not reported"}</dd></div>
        </dl>
      </div>
      <Badge className={`rail-status ${result.status.toLowerCase()}`}>{result.status.replaceAll("_", " ")}</Badge>
      <Separator />
      <div className="rail-coverage">
        <span>Evidence coverage</span><em>{result.evidenceScore.band}</em>
        <strong>{result.evidenceScore.score}<small>/{result.evidenceScore.maxScore}</small></strong>
        <p>{missingCoverage(result)}</p>
      </div>
      <Button className="rail-action" type="button" onClick={() => document.getElementById("assessment-limits")?.scrollIntoView({ behavior: "smooth", block: "start" })}><CalendarPlus size={15} />Schedule field survey</Button>
      <SiteMap result={result} compact />
      <Button className="rail-secondary" variant="ghost" size="sm" type="button" onClick={onCheckAnother}><ChevronLeft size={14} />Check another site</Button>
    </aside>
  );
}
