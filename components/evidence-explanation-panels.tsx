import type { AssessmentResult } from "@/lib/domain/assessment";

const panels = [
  { id: "serviceArea", title: "Operating-area context", source: "InstallIQ calculation + Precisely routing" },
  { id: "evInfrastructure", title: "Public EV infrastructure", source: "US AFDC public-station inventory" },
  { id: "evidenceCoverage", title: "Digital evidence coverage", source: "Published InstallIQ weights" },
  { id: "fieldSurvey", title: "Why a field survey remains", source: "InstallIQ safety policy" },
] as const;

export function EvidenceExplanationPanels({ result }: { result: AssessmentResult }) {
  const modelLabel = result.brief.source === "openai" ? "AI explanation" : "Rules-based explanation";
  return (
    <section className="evidence-explanations" aria-label="Evidence explanations">
      <div className="section-heading">
        <div><div className="eyebrow">EVIDENCE INTERPRETATION</div><h3>What the data means—and what it does not</h3></div>
        <span>{modelLabel}; facts and policy remain unchanged</span>
      </div>
      <div className="explanation-grid">
        {panels.map((panel) => (
          <article key={panel.id}>
            <div><b>{panel.title}</b><small>Based on: {panel.source}</small></div>
            <p>{result.brief.explanations[panel.id]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
