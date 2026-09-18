# Limitations

## Scope

- InstallIQ does not determine electrical capacity, transformer or panel capacity, existing load, utility interconnection, permit approval, conduit or trenching paths, ADA design, physical obstructions, cost, or installation approval. Those are the field-survey gaps listed on every assessment.
- Jurisdiction and AHJ context identify who has authority. They are not a permit determination.
- The operating-area check is InstallIQ's own configured policy (`SERVICE_BASE_*`, `SERVICE_RADIUS_MILES`), not a Precisely finding. It uses the Precisely traffic-aware route when one is returned and falls back to a visibly labelled straight-line Haversine distance when routing is unavailable — in that case drive time is not established.
- The Digital Evidence Coverage Index measures how much digital evidence came back. It is not a site-quality, feasibility, permitting, capacity, cost, or approval score, and a high score with an unavailable route still means less was verified.
- AFDC public-station records describe nearby public infrastructure. They do not confirm on-site capacity, ownership, live availability, or a need for new chargers, and pin positions are AFDC coordinates rather than verified charger placement.

## Data

- Live data availability depends on the enabled Precisely products and action contracts in the tenant catalog; an action that is not enabled is reported as unavailable rather than substituted.
- Hosted gateway actions are never guessed. InstallIQ executes only a capability whose approved action ID is returned by the gateway's own search and whose current schema accepts InstallIQ's arguments.
- Local-mode tool mapping uses conservative name matching. Inspect `npm run mcp:tools` before trusting a new local deployment.
- Property fields arrive per-source and are merged first-non-empty; sentinel values such as `-1` are rendered as "Not reported" rather than zero.
- The AFDC lookup returns at most twelve public, operational stations within the configured radius and aborts after eight seconds.

## Prototype boundaries

- There is no authentication, database, CRM, dispatching, or report export. Every assessment is ephemeral and lives only in the browser tab that ran it.
- There is no mock or fixture data mode. With no MCP endpoint configured the assessment API fails, by design.
- The request form collects only a site name and address. The request model still carries charger type/count, so those are submitted as `UNKNOWN`/`1`.
- Raw source responses are rendered in the evidence drawer as returned. The `redact` helper exists in `lib/precisely/redact.ts` but is not yet applied to that view, so treat the drawer as unredacted.
- The Playwright suite covers one report path and currently asserts the pre-redesign dashboard markup, so `npm run test:e2e` fails until it is updated. `npm run lint`, `npm run typecheck`, and `npm test` pass.
- `components/status-banner.tsx`, `assessment-rail.tsx`, `site-stats-bento.tsx`, `digital-evidence-coverage.tsx`, and `evidence-explanation-panels.tsx` are left over from the earlier dashboard and are no longer rendered.
