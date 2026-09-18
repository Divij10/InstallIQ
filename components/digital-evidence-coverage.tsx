import type { AssessmentResult } from "@/lib/domain/assessment";

export function DigitalEvidenceCoverage({ result }: { result: AssessmentResult }) {
  const { evidenceScore } = result;
  return (
    <section className="digital-evidence-card" aria-label="Digital evidence coverage">
      <div className="section-heading">
        <div>
          <div className="eyebrow">DIGITAL EVIDENCE COVERAGE</div>
          <h3>How complete is this digital record?</h3>
        </div>
        <div className="evidence-score-total"><strong>{evidenceScore.score}</strong><span>/ {evidenceScore.maxScore}</span><small>{evidenceScore.band} coverage</small></div>
      </div>
      <p className="coverage-disclaimer">{evidenceScore.disclaimer}</p>
      <div className="evidence-score-factors">
        {evidenceScore.factors.map((factor) => (
          <article key={factor.id}>
            <div><b>{factor.label}</b><strong>{factor.earned}/{factor.weight}</strong></div>
            <div className="evidence-meter" aria-label={`${factor.label}: ${factor.earned} of ${factor.weight} evidence points`}><i style={{ width: `${(factor.earned / factor.weight) * 100}%` }} /></div>
            <p>{factor.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
