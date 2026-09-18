# Live Precisely MCP setup

Live mode is intentionally opt-in and remains a true failure if credentials or the MCP endpoint are unavailable.

1. Clone Precisely's official `PreciselyData/precisely-mcp-servers` repository.
2. Enter its Locate MCP implementation and follow its current official dependency and HTTP transport instructions.
3. Configure its Precisely credentials outside this repository.
4. Start its HTTP MCP transport (the InstallIQ local default is `http://127.0.0.1:8000/mcp`).
5. In `.env.local`, set `INSTALLIQ_DATA_MODE=local` and `PRECISELY_MCP_URL`.
6. Run `npm run mcp:verify` to list the semantic capabilities discovered at runtime.
7. Start InstallIQ and perform one low-risk assessment.

For a hosted DIS gateway use `INSTALLIQ_DATA_MODE=hosted` and `PRECISELY_MCP_URL=https://api.cloud.precisely.com/dis-mcp/mcp`. The server constructs the required `Authorization: Apikey <base64(api_key:api_secret)>` header from server-side environment variables. The adapter feature-detects direct tools and does not guess undocumented hosted action schemas. Never place API keys in `NEXT_PUBLIC_*` variables, browser requests, logs, or committed files.

Live smoke test: not executed in this workspace because no credentials or endpoint were supplied.
