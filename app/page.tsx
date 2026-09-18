"use client";

import { useEffect, useState } from "react";
import { AssessmentDashboard } from "@/components/assessment-dashboard";
import { AssessmentHeader } from "@/components/assessment-header";
import { InstallRequestForm } from "@/components/install-request-form";
import type { AssessmentRequest, AssessmentResult } from "@/lib/domain/assessment";

export default function Home() {
  const [result, setResult] = useState<AssessmentResult>();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>();
  const [mode, setMode] = useState<"local" | "hosted">("hosted");
  useEffect(() => { fetch("/api/health").then(async (response) => response.ok && setMode((await response.json()).mode)).catch(() => undefined); }, []);
  const run = async (request: AssessmentRequest) => { setRunning(true); setError(undefined); try { const response = await fetch("/api/assessment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Assessment failed"); setResult(payload); setMode(payload.mode); } catch (caught) { setError(caught instanceof Error ? caught.message : "Assessment failed"); } finally { setRunning(false); } };
  return <div className="shell"><AssessmentHeader mode={mode} />{result ? <main className="assessment-workspace"><div className="workspace-heading"><div><div className="eyebrow">SITE ASSESSMENT</div><h2>{result.location.standardizedAddress ?? result.location.submittedAddress}</h2></div><button className="new-site" onClick={() => { setResult(undefined); setError(undefined); }}>Check another site</button></div>{error && <div className="error" role="alert">{error}</div>}<AssessmentDashboard result={result} /></main> : <main className="start-screen"><section className="start-copy"><div className="eyebrow">COMMERCIAL EV INFRASTRUCTURE</div><h1>Know the site<br />before the truck rolls.</h1><p>InstallIQ verifies location, preserves live data provenance, and prepares the human survey that follows.</p><div className="start-points"><span>Verified location</span><span>Operating-area check</span><span>Field-survey handoff</span></div></section><InstallRequestForm onRun={run} running={running} />{error && <div className="error" role="alert">{error}</div>}</main>}</div>;
}
