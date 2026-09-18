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
  return <div className={result ? "shell shell-report" : "shell"}>{!result && <AssessmentHeader mode={mode} />}{result ? <main className="assessment-workspace">{error && <div className="error" role="alert">{error}</div>}<AssessmentDashboard result={result} onCheckAnother={() => { setResult(undefined); setError(undefined); }} /></main> : <main className="start-screen"><InstallRequestForm onRun={run} running={running} />{error && <div className="error" role="alert">{error}</div>}</main>}</div>;
}
