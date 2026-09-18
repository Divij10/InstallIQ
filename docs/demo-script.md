# Five-minute demo

Run with `INSTALLIQ_DATA_MODE=hosted` and live Precisely credentials. Confirm the connection first with `npm run mcp:verify`, and `npm run mcp:smoke` for a single live address call. There is no fixture mode, so a broken endpoint shows as a failure rather than a demo.

**0:00–0:30 — The question.** "Before sending an engineer to a commercial EV installation site, how much can we establish digitally, and can we prove where every fact came from?"

**0:30–1:00 — Intake.** Show the start screen and the `Live Precisely data` badge. Type an address such as `21001 N Tatum Blvd, Phoenix, AZ` and let the suggestions appear — those come from `geo_addressing.autocomplete` running server-side, not from the browser. Point out that the browser sends a business request and never names a tool.

**1:00–2:00 — The verdict.** Submit and land on the report. Read the verdict line and the evidence chips beside it. Say plainly that the status is deterministic policy, and the sentence next to it is an explanation layer that cannot change the status — with no OpenAI key it is written by rules instead.

**2:00–3:00 — Site and surroundings.** Use the map. Switch focus from **Site** to **Chargers** to reframe onto the AFDC public stations, then open the **Public charging** tab to match the numbered pins to the station table. Stress that these are nearby public stations, not on-site capacity.

**3:00–4:00 — The record.** Open the **Site record** tab and expand Site identity, then Property. Every row names its source and says "Not reported" when the source returned nothing. Note the service-area row: the decision metric says whether the driving route or the straight-line fallback was used.

**4:00–4:40 — Provenance.** Open the **Source activity** tab. Walk the action log — skill starts, tool calls, the address gate, the policy decision — then expand one raw source response to show the action ID and timestamp behind a fact.

**4:40–5:00 — The claim.** "The system never asks a model to invent physical site facts. Precisely provides trusted evidence, AFDC provides separately labelled public-charging context, and the agent decides what to collect and what should happen next. Electrical capacity, permitting, and utility interconnection stay with the field survey." The hypothesis is less avoidable pre-survey work, better field preparation, and an auditable request-to-survey flow.
