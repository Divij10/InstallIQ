# InstallIQ agent guide

Read [INSTALLIQ_SPEC.md](INSTALLIQ_SPEC.md) for the original brief, but treat the code and `docs/` as the current truth where they differ. Architecture and the code map live in `docs/architecture.md`, the capability-to-action bindings in `docs/precisely-capability-map.md`, known gaps in `docs/limitations.md`, and running and demo guidance in `README.md`.

Non-negotiables:

1. Never fabricate Precisely or AFDC results. An unavailable capability is reported as unavailable.
2. Never expose credentials. Precisely, AFDC, and OpenAI keys stay server-side; only the Google Maps browser key reaches the client, via `/api/maps/config`.
3. Never represent InstallIQ as determining electrical feasibility, utility capacity, permitting, cost, or installation approval.
4. Every external fact shown to a user keeps its provenance: provider, capability, resolved action or tool name, and timestamp.
5. Keep the LLM explanation-only. It gets normalized facts, has no tools, and must not change the policy status or the coverage index; on any failure fall back to the deterministic rules brief.
6. Preserve live failures as failures. There is no mock or fixture mode, and adding one would need a visible label.
7. Keep policy and scoring deterministic and in `lib/agent/`. New evidence is a new skill returning `{ data, evidence, warnings, trace }`.

A new Precisely capability needs four edits: the `PreciselyCapability` union in `lib/precisely/types.ts`, the approved action ID, search goal, and input transform in `lib/precisely/action-gateway-adapter.ts`, and a local alias in `lib/precisely/capability-registry.ts`.

Before completion run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. `npm run test:e2e` currently fails against the redesigned dashboard; fix the spec rather than the UI if you touch that path.
