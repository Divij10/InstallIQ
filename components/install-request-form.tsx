"use client";

import { useEffect, useState } from "react";
import type { AssessmentRequest } from "@/lib/domain/assessment";

type AddressSuggestion = { label: string };

const initial: AssessmentRequest = {
  businessName: "",
  contactName: "",
  email: "",
  phone: "",
  rawAddress: "",
  chargerType: "UNKNOWN",
  chargerCount: 1,
  notes: ""
};

export function InstallRequestForm({ onRun, running }: { onRun: (request: AssessmentRequest) => void; running: boolean }) {
  const [form, setForm] = useState(initial);
  const [addressTouched, setAddressTouched] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    if (!addressTouched || form.rawAddress.trim().length < 3) { setSuggestions([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSuggesting(true);
      try {
        const response = await fetch(`/api/address-suggestions?q=${encodeURIComponent(form.rawAddress)}`, { signal: controller.signal });
        const payload = await response.json();
        if (response.ok) setSuggestions(payload.suggestions ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setSuggestions([]);
      } finally { setSuggesting(false); }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [addressTouched, form.rawAddress]);

  const selectAddress = (label: string) => { setForm((current) => ({ ...current, rawAddress: label })); setSuggestions([]); };
  return <section className="intake-card" aria-label="Start a site assessment">
    <div className="eyebrow">LIVE PRE-SITE CHECK</div>
    <h2>Where is the installation?</h2>
    <p>We verify the site before asking your team for technical survey details.</p>
    <form onSubmit={(event) => { event.preventDefault(); onRun(form); }}>
      <label htmlFor="business">Site or business name</label>
      <input id="business" value={form.businessName} onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))} placeholder="Desert Ridge Marketplace" required autoComplete="organization" />
      <label htmlFor="address">Installation address</label>
      <div className="address-control">
        <input id="address" value={form.rawAddress} onChange={(event) => { setAddressTouched(true); setForm((current) => ({ ...current, rawAddress: event.target.value })); }} placeholder="Start typing an address" required autoComplete="street-address" aria-describedby="address-help" />
        {suggestions.length > 0 && <ul className="address-suggestions" role="listbox">{suggestions.map((suggestion) => <li key={suggestion.label}><button type="button" onClick={() => selectAddress(suggestion.label)}>{suggestion.label}</button></li>)}</ul>}
      </div>
      <small id="address-help">{suggesting ? "Finding address suggestions…" : "Choose a suggestion to verify the site faster."}</small>
      <button className="primary" disabled={running}>{running ? "VERIFYING SITE…" : "CHECK THIS SITE"}</button>
    </form>
  </section>;
}
