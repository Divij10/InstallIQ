import type { Evidence } from "@/lib/domain/evidence"; import { EvidenceCard } from "./evidence-card";
export function RawEvidenceDrawer({evidence}:{evidence:Evidence[]}){return <section className="panel evidence-drawer"><h2>Source responses</h2><p className="muted">Raw output is collapsed and sensitive values are redacted.</p>{evidence.map(x=><EvidenceCard key={x.id} evidence={x}/>)}</section>}
