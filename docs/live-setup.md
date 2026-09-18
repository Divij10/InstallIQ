# Live Precisely MCP setup

Live data is the only data path. If credentials or the MCP endpoint are unavailable, the assessment fails and is shown as a failure.

## Hosted DIS gateway (default)

1. In `.env.local` set `INSTALLIQ_DATA_MODE=hosted` and `PRECISELY_MCP_URL=https://api.cloud.precisely.com/dis-mcp/mcp`.
2. Set `PRECISELY_API_KEY` and `PRECISELY_API_SECRET`. The server builds the required `Authorization: Apikey <base64(api_key:api_secret)>` header from them. Never place API keys in `NEXT_PUBLIC_*` variables, browser requests, logs, or committed files.
3. Run `npm run mcp:verify`. On the hosted gateway it confirms the connection and reports that capabilities are searched and schema-described on demand.
4. Run `npm run mcp:smoke` for one live `ADDRESS_VERIFY` call. Override the address with `INSTALLIQ_SMOKE_ADDRESS`.
5. Start InstallIQ and run one low-risk assessment.

The adapter feature-detects direct tools first and only then falls back to the `precisely_actions_search` → `precisely_actions_describe` → validate → `precisely_actions_execute` loop. It never guesses an undocumented hosted action schema: an action InstallIQ has no approved contract for is reported unavailable.

Two scripts help when a tenant catalog changes:

- `npm run mcp:catalog` runs the semantic search for every goal InstallIQ cares about and prints the candidate action IDs.
- `npm run mcp:inspect -- property.roof_attributes tax.jurisdiction` prints the raw describe payload, including the input schema, for named action IDs.
- `npm run mcp:describe -- "validate and standardize a street address"` searches by goal and describes the top action; `npm run mcp:describe -- --action geo_addressing.verify_address` skips the search. It requires hosted mode.

## Local Precisely MCP server

1. Clone Precisely's official `PreciselyData/precisely-mcp-servers` repository.
2. Enter its Locate MCP implementation and follow its current official dependency and HTTP transport instructions.
3. Configure its Precisely credentials outside this repository.
4. Start its HTTP MCP transport (the InstallIQ local default is `http://127.0.0.1:8000/mcp`).
5. In `.env.local`, set `INSTALLIQ_DATA_MODE=local` and `PRECISELY_MCP_URL`.
6. Run `npm run mcp:verify` to list the semantic capabilities discovered at runtime, and `npm run mcp:tools` to see every tool and its input schema. Local mode maps tools by conservative name matching, so check this list before trusting a new deployment.

`GET /api/mcp/health` returns the same picture at runtime: connection state, discovered capability count, and which required capabilities (`ADDRESS_VERIFY`, `ADDRESS_GEOCODE`) resolved.

## Non-Precisely keys

These are independent of the MCP layer and each degrades visibly rather than blocking an assessment:

- `NREL_API_KEY` — AFDC public EV-station context, with `EV_STATION_SEARCH_RADIUS_MILES` (default 5).
- `GOOGLE_MAPS_API_KEY` — the browser map canvas, served through `/api/maps/config`. Restrict it by HTTP referrer in Google Cloud.
- `OPENAI_API_KEY` and `OPENAI_MODEL` — the explanation-only narrative. Without them the deterministic rules brief is used.

Live smoke test: not executed in this workspace, because no credentials or endpoint were supplied here.
