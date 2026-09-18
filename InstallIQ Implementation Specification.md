# InstallIQ
## Agentic Pre-Site Intelligence for EV Infrastructure Installation

Version: 1.0  
Status: Build specification  
Primary goal: Interview demonstration for Precisely  
Implementation priority: reliability and demonstrability over unnecessary feature breadth

---

# 1. PRODUCT MISSION

Build a polished full-stack application named **InstallIQ**.

InstallIQ takes a commercial EV-charger installation request and assembles a trusted digital pre-site assessment before a field engineer is dispatched.

The system must demonstrate:

1. Precisely MCP integration.
2. Reusable business skills built on Precisely capabilities.
3. An agent that conditionally orchestrates those skills.
4. Trusted-data-first AI/system design.
5. Explicit provenance for every factual claim.
6. Graceful handling of incomplete data.
7. A clear business decision / next-best-action at the end.
8. A professional UI suitable for a live interview demonstration.

The application DOES NOT determine whether EV chargers can actually be installed.

The application DOES NOT make electrical-engineering decisions.

Its job is:

> Establish what can be determined digitally from trusted Precisely data, identify what remains unknown, and prepare the next human field action.

---

# 2. BUSINESS PROBLEM

A commercial property owner requests installation of EV charging infrastructure.

Before an electrical contractor sends an engineer, the contractor usually needs basic site intelligence:

- Is the submitted address valid?
- Which physical location does it represent?
- What property/building/parcel data is available?
- What jurisdictional context applies?
- What surrounding location context is available?
- Is the site inside the contractor's configured operating area?
- Which pieces of information cannot be determined digitally?
- What should happen next?

Sending a field engineer before resolving the first set of questions wastes skilled labor and creates avoidable administrative work.

InstallIQ performs that pre-site information-gathering step.

---

# 3. DEMO STORY

Primary demo scenario:

Business/site:
Desert Ridge Marketplace

Address:
21001 N Tatum Blvd
Phoenix, AZ 85050

Installation request:
6 Level-2 EV chargers

Contact:
Alex Johnson

Email:
Use a clearly designated demo email address.

Phone:
Use a clearly designated demo phone number.

IMPORTANT:

Do not present the demo email or phone as belonging to an actual person.

Do not hard-code fake Precisely results and present them as live results.

If mock mode is enabled, display a visible:

DEMO FIXTURE

badge.

If live mode is enabled, display:

LIVE PRECISELY DATA

Never silently substitute mock data after a live API failure.

---

# 4. PRIMARY USER

Primary persona:

Commercial EV installation project coordinator.

The coordinator wants to convert an inbound installation request into a structured pre-site intelligence package.

Secondary persona:

Field engineer who will receive the resulting site packet.

---

# 5. CORE VALUE PROPOSITION

Use this exact conceptual framing throughout the application:

> Turn an installation request into a trusted site-intelligence package before an engineer gets in the truck.

Do NOT frame InstallIQ as an autonomous engineering approval system.

Do NOT use language such as:

- installation approved
- electrically feasible
- permit approved
- grid capacity sufficient
- transformer adequate
- site is safe
- installation guaranteed

unless an external authoritative system actually provides that information.

---

# 6. TECH STACK

Use a single full-stack TypeScript application.

Required:

- Next.js with App Router
- TypeScript with strict mode
- React
- Tailwind CSS
- Zod for runtime validation
- official Model Context Protocol TypeScript SDK where appropriate
- Vitest for unit/integration tests
- React Testing Library for component tests where valuable
- Playwright for one core end-to-end path
- ESLint
- Prettier if compatible with the scaffold
- npm unless an existing repository package manager dictates otherwise

Do not add a database.

Assessment data should be ephemeral.

Do not introduce authentication.

This is an interview prototype, not a production SaaS deployment.

Use current stable mutually compatible package versions and commit the lockfile.

---

# 7. REPOSITORY STRUCTURE

Create approximately this structure:

/
  AGENTS.md
  INSTALLIQ_SPEC.md
  README.md
  .env.example
  package.json
  next.config.*
  tsconfig.json

  app/
    page.tsx
    layout.tsx
    globals.css

    api/
      assessment/
        route.ts

      health/
        route.ts

      mcp/
        health/
          route.ts

  components/
    install-request-form.tsx
    assessment-dashboard.tsx
    assessment-header.tsx
    status-banner.tsx
    agent-activity.tsx
    evidence-card.tsx
    customer-validation-card.tsx
    location-card.tsx
    property-card.tsx
    jurisdiction-card.tsx
    site-context-card.tsx
    service-area-card.tsx
    information-gaps-card.tsx
    next-action-card.tsx
    raw-evidence-drawer.tsx
    data-mode-badge.tsx

  lib/
    domain/
      assessment.ts
      evidence.ts
      trace.ts
      status.ts

    agent/
      site-readiness-agent.ts
      policy.ts
      explanation.ts

    skills/
      types.ts
      contact-validation.ts
      address-resolution.ts
      property-intelligence.ts
      jurisdiction-context.ts
      site-context.ts
      service-area.ts
      optional-routing.ts

    precisely/
      client.ts
      types.ts
      capability-registry.ts
      direct-tool-adapter.ts
      action-gateway-adapter.ts
      normalization.ts
      redact.ts
      errors.ts

    mock/
      mock-precisely-client.ts
      fixtures.ts

    config/
      env.ts
      service-area.ts

  fixtures/
    success-commercial-site.json
    invalid-address.json
    partial-property-data.json
    mcp-error.json

  scripts/
    verify-mcp.ts
    print-mcp-tools.ts

  docs/
    architecture.md
    demo-script.md
    precisely-capability-map.md
    limitations.md
    live-setup.md

  tests/
    unit/
    integration/
    e2e/

Do not mechanically create empty files. Only create files that contain useful implementation or documentation.

---

# 8. AGENTS.MD

Keep AGENTS.md concise.

It should point Codex and future coding agents to:

- INSTALLIQ_SPEC.md
- docs/architecture.md
- docs/precisely-capability-map.md
- README.md

It must state the important non-negotiable rules:

1. Never fabricate Precisely results.
2. Never expose credentials.
3. Never describe the application as determining electrical feasibility.
4. All external facts shown to users require provenance.
5. Mock mode must be visibly identified.
6. Live failures must remain failures.
7. Run lint, typecheck, tests, and build before declaring work complete.

Do not copy this entire specification into AGENTS.md.

---

# 9. DOMAIN MODEL

Create strongly typed domain models.

At minimum:

## AssessmentRequest

Fields:

- requestId?: string
- businessName: string
- contactName: string
- email?: string
- phone?: string
- rawAddress: string
- chargerType: "LEVEL_2" | "DC_FAST" | "UNKNOWN"
- chargerCount: number
- notes?: string

Validation:

- business name required
- contact name required
- address required
- charger count integer >= 1 and <= 100
- email optional
- phone optional
- notes length limited
- trim all user inputs

---

## Evidence<T>

Every external result should normalize into something conceptually similar to:

type Evidence<T> = {
  status: "success" | "not_found" | "unavailable" | "error";
  source: {
    provider: "Precisely" | "InstallIQ";
    transport?: "mcp";
    capability: string;
    toolName?: string;
    actionName?: string;
  };
  data?: T;
  message?: string;
  retrievedAt: string;
  rawAvailable: boolean;
};

The final UI must be built from normalized evidence rather than directly rendering arbitrary API response structures.

---

## AgentTraceEvent

Fields:

- id
- timestamp
- phase
- type:
  - observation
  - decision
  - skill_started
  - tool_called
  - tool_completed
  - skill_completed
  - warning
  - stopped
  - completed
- skillName?
- toolName?
- message
- durationMs?
- status?

Do not expose secrets or full authorization headers in trace events.

---

# 10. FINAL ASSESSMENT STATES

Only use the following top-level outcomes:

## FIELD_SURVEY_REQUIRED

Use when:

- the physical location has been sufficiently resolved,
- useful digital site intelligence has been collected,
- site is inside configured service area if service-area checking is enabled,
- and physical engineering facts still require field verification.

This should be the normal successful outcome.

---

## ADDRESS_CORRECTION_REQUIRED

Use when:

- submitted address cannot be sufficiently verified/resolved,
- or geocoding fails in a way that makes subsequent location enrichment unreliable.

Do not continue property/jurisdiction enrichment when the system does not have a trustworthy site identity.

---

## MANUAL_DATA_REVIEW

Use when:

- address resolves,
- but important digital enrichment cannot be obtained,
- property identity is ambiguous,
- significant MCP capabilities error,
- or conflicting evidence is returned.

---

## OUTSIDE_SERVICE_AREA

Use when:

- location resolves,
- configured company operating-area logic is active,
- and the resolved site is outside that configured area.

---

## SYSTEM_ERROR

Use only for unrecoverable application-level failure.

Do not use SYSTEM_ERROR for an ordinary "data not found" result.

---

# 11. INFORMATION GAPS

Regardless of how much Precisely data exists, the application should explain that some installation questions require other systems or physical inspection.

Default field-survey information gaps may include:

- electrical service capacity
- switchgear/panel capacity
- transformer capacity
- existing electrical load
- physical conduit/path availability
- charger placement
- parking-layout constraints
- trenching requirements
- ADA/accessibility design requirements
- utility interconnection requirements
- site-specific permitting requirements
- final installation cost
- structural/physical obstructions

Do not claim Precisely has answered these unless there is explicit authoritative evidence.

---

# 12. PRECISELY MCP ARCHITECTURE

Implement a transport-independent Precisely gateway.

The rest of InstallIQ must not depend directly on one MCP deployment style.

Create a conceptual interface such as:

interface PreciselyClient {
  connect(): Promise<void>;
  health(): Promise<PreciselyHealth>;
  listCapabilities(): Promise<CapabilitySummary[]>;
  invoke(
    capability: PreciselyCapability,
    input: unknown
  ): Promise<PreciselyInvocationResult>;
  close(): Promise<void>;
}

Support three modes:

- local
- hosted
- mock

Environment configuration determines mode.

---

# 13. LOCAL MCP MODE

Support connection to a locally running Precisely MCP server.

Expected default endpoint:

http://127.0.0.1:8000/mcp

Do not assume a fixed number of MCP tools.

Perform capability discovery.

Known direct tools that may exist include capabilities corresponding to:

- verify_address
- geocode
- verify_emails
- parse_name
- validate_phones
- get_property_data
- get_property_attributes_by_address
- get_buildings_by_address
- get_parcels_by_address
- lookup_tax_jurisdiction
- find_emergency_services
- get_timezones
- get_places_by_address

Feature-detect before invoking.

If one optional tool is unavailable, the entire assessment must not necessarily fail.

---

# 14. HOSTED MCP MODE

Support the hosted DIS MCP gateway.

Do not expose API credentials to the browser.

When API-key authentication is used:

- accept API key and secret through server-side environment variables
- construct the required authorization value on the server
- never log it
- never send it to client JavaScript

The hosted gateway may expose meta-tools conceptually corresponding to:

- precisely_actions_search
- precisely_actions_describe
- precisely_actions_execute

When these tools are available, implement an adapter that:

1. discovers the relevant action,
2. resolves its current schema,
3. executes it,
4. normalizes the result.

Do not hard-code undocumented action schemas if the MCP server can describe them dynamically.

Cache resolved capability/action mappings for the life of the server process where safe.

---

# 15. MOCK MODE

Mock mode is mandatory.

It exists for:

- frontend development
- deterministic tests
- interview resilience if connectivity fails

Rules:

- MOCK data must never be labeled live.
- UI must display DEMO FIXTURE prominently.
- mock responses must use the same normalized domain contracts as live responses.
- do not imitate confidential/proprietary raw responses unnecessarily.
- fixture values may be synthetic.

Provide at least four scenarios:

1. successful commercial site
2. bad/unresolvable address
3. partial property intelligence
4. MCP failure

Allow selecting the fixture via development-only configuration or a demo preset.

---

# 16. CAPABILITY REGISTRY

Create an internal semantic capability enum.

Example:

- CONTACT_NAME_PARSE
- CONTACT_EMAIL_VERIFY
- CONTACT_PHONE_VALIDATE
- ADDRESS_VERIFY
- ADDRESS_GEOCODE
- PROPERTY_ATTRIBUTES
- BUILDING_INFORMATION
- PARCEL_INFORMATION
- TAX_JURISDICTION
- AUTHORITY_HAVING_JURISDICTION
- TIMEZONE
- PLACES_CONTEXT
- ROUTE_OR_TRAVEL_TIME

Map semantic capabilities to actual MCP tools/actions at runtime.

This prevents business code from becoming coupled to vendor-specific operation names.

---

# 17. SKILL MODEL

Treat a Skill as a reusable business capability that may invoke one or several MCP tools.

Use an interface conceptually similar to:

interface Skill<I, O> {
  id: string;
  description: string;
  canRun(context: AssessmentContext): boolean;
  run(context: AssessmentContext, input: I): Promise<SkillResult<O>>;
}

Each skill must:

- receive typed input
- produce normalized output
- add trace events
- record provenance
- handle expected tool failure
- avoid throwing for ordinary "not found"
- throw only on genuine application-level failures

---

# 18. REQUIRED SKILLS

Implement the following.

## 18.1 ContactValidationSkill

Purpose:

Establish whether supplied contact fields appear usable.

Possible capabilities:

- name parsing
- email validation
- phone validation

Behavior:

- validation failures should create warnings
- contact failure alone should normally NOT prevent site intelligence
- missing optional email/phone should be represented as "not supplied", not "invalid"

Outputs:

- parsed name if available
- email status
- phone status
- warnings
- evidence references

---

## 18.2 AddressResolutionSkill

Purpose:

Establish trustworthy physical site identity.

Sequence:

1. verify/standardize address
2. if successful, geocode resolved address
3. preserve Precisely-provided match/quality metadata where available

Important:

Do not invent a match-confidence score.

If Precisely provides match metadata, preserve it.

If it does not, say:

"Source did not provide a normalized confidence value."

Output:

- submitted address
- standardized address
- coordinates
- provider match metadata
- Precisely ID if available
- evidence

This skill is a hard gate.

Failure should result in ADDRESS_CORRECTION_REQUIRED.

---

## 18.3 PropertyIntelligenceSkill

Run only after successful site resolution.

Collect the useful subset available from:

- property attributes
- building information
- parcel information

Do not dump hundreds of attributes.

Normalize useful interview-demo information such as:

- property type/use
- building area where available
- year built where available
- parcel identifier where available
- lot area where available
- building count where available
- other high-value non-speculative characteristics

Preserve unknown values as unknown.

Never fabricate missing attributes.

---

## 18.4 JurisdictionContextSkill

Collect:

- tax jurisdiction context
- emergency/PSAP/AHJ context where available

IMPORTANT:

The output must explicitly state:

> Jurisdictional location context is not the same as a permit determination.

The application must never imply that AHJ lookup proves which permit is required or that a permit has been approved.

---

## 18.5 SiteContextSkill

Optional enrichment.

Use capabilities such as:

- time zone
- places/business context

This skill should not block assessment completion.

If places data is available, summarize only a handful of relevant context points.

Do not turn it into a huge POI directory.

---

## 18.6 ServiceAreaSkill

This is InstallIQ-owned business logic.

It is not presented as Precisely-provided serviceability.

Configuration:

- service-base latitude
- service-base longitude
- maximum service radius miles

Use the verified/geocoded Precisely location.

Compute geodesic/Haversine distance locally.

Clearly label this as:

Straight-line operating-area distance

Do NOT call it drive time.

If a genuine Precisely routing/travel-time action is discovered and implemented, show that separately.

---

## 18.7 OptionalRoutingSkill

This is optional and must be capability-driven.

At runtime determine whether the available Precisely MCP deployment exposes an appropriate routing/travel-time action.

If available:

- invoke it
- display source provenance
- distinguish drive/travel time from straight-line distance

If unavailable:

- do not fail
- hide or disable the route/travel-time feature
- explain that route intelligence is not enabled in the current workspace

Never invent a route.

---

# 19. SITE READINESS AGENT

Create `SiteReadinessAgent`.

It must be an actual observe-decide-act loop, not merely a page that fires every API call regardless of results.

The agent owns:

- current assessment state
- collected evidence
- warnings
- information gaps
- trace
- next skill selection
- stopping conditions
- final policy evaluation

Conceptual loop:

while assessment not terminal:
  observe state
  determine next eligible skill
  record decision
  execute skill
  update state
  evaluate whether to continue or stop

The agent must have deterministic safety/policy rules.

LLM usage is optional and must NOT be required for correctness.

---

# 20. AGENT EXECUTION POLICY

Required behavior:

### Step 1
Validate user input.

### Step 2
Run ContactValidationSkill.

Contact warnings do not normally block location processing.

### Step 3
Run AddressResolutionSkill.

If address cannot be resolved:
- stop site-specific enrichment
- outcome = ADDRESS_CORRECTION_REQUIRED

### Step 4
Once location is resolved, execute independent enrichments.

Property, jurisdiction, context, and service-area checks may execute concurrently where technically safe.

### Step 5
Evaluate completeness.

If location is trusted but major site data fails due system/tool problems:
- outcome = MANUAL_DATA_REVIEW

### Step 6
Evaluate service-area rule.

If outside configured operating area:
- outcome = OUTSIDE_SERVICE_AREA

### Step 7
If digital assessment completes successfully:
- outcome = FIELD_SURVEY_REQUIRED

### Step 8
Generate evidence-grounded explanation and next action.

---

# 21. OPTIONAL LLM USE

InstallIQ must function without a second commercial AI API.

If an LLM is later enabled, restrict its responsibilities to:

- summarizing normalized evidence
- explaining the next action
- formatting human-readable rationale

The LLM must not invent site facts.

Pass the LLM only structured evidence already collected.

The LLM output should be considered presentation text, not authoritative evidence.

The deterministic policy remains the source of the final status.

If no LLM key exists, use deterministic templated explanation generation.

---

# 22. DATA PROVENANCE

This is a high-priority feature.

Every factual output derived from Precisely should be associated with:

- Precisely
- capability
- MCP tool/action when known
- retrieval time
- status

UI cards should provide a small "Source" affordance.

Include an expandable Evidence/Raw Data drawer.

Raw data should:

- be collapsed by default
- be formatted
- redact sensitive fields
- not display API credentials

This lets the interviewer inspect what came from Precisely versus what came from application logic.

---

# 23. TRUSTED DATA VS AGENT REASONING UI

Include a small section called:

Trusted data vs. agent reasoning

Two columns:

## Trusted data

Examples:

- standardized address
- coordinates
- property attributes
- parcel information
- jurisdiction context
- AHJ/PSAP context
- places context

## Agent/application reasoning

Examples:

- deciding which skill runs next
- determining whether data is sufficient
- stopping after address failure
- applying configured service-area rules
- determining next-best-action
- identifying missing field-survey information

This is important for the interview.

---

# 24. FRONTEND

Create a polished single-page workflow.

Avoid generic AI-chat UI.

This is an operational decision-support application.

Use a professional light interface.

Suggested layout:

Header
- InstallIQ logo/name
- subtitle: Agentic Pre-Site Intelligence
- MCP connectivity indicator
- LIVE PRECISELY DATA or DEMO FIXTURE badge

Left/upper section
- installation request form

After submission
- assessment status
- agent activity
- intelligence cards
- information gaps
- next action
- evidence details

---

# 25. REQUEST FORM

Fields:

Business / Site Name
Contact Name
Email
Phone
Installation Address
Charger Type
Number of Chargers
Notes

Primary button:

RUN PRE-SITE ASSESSMENT

Include:

LOAD DEMO REQUEST

button.

The demo request should populate the known commercial demo scenario.

Do not automatically submit after loading.

---

# 26. AGENT ACTIVITY PANEL

This is essential.

Show meaningful execution events, for example:

Request received

Validating customer contact...

Address Resolution Skill started

Precisely MCP → address verification

Address standardized

Precisely MCP → geocode

Site resolved

Property Intelligence Skill started

Retrieving property attributes

Retrieving building information

Retrieving parcel information

Jurisdiction Context Skill started

Resolving location jurisdiction

Resolving AHJ/PSAP context

Evaluating operating area

Assessment policy evaluated

FIELD SURVEY REQUIRED

Do not expose private chain-of-thought.

The timeline represents externally observable actions and policy decisions only.

Never label hidden reasoning as "chain of thought".

---

# 27. RESULT DASHBOARD

Required cards:

## Assessment status

Large status banner.

Example:

FIELD SURVEY REQUIRED

Supporting explanation.

---

## Customer validation

Show:

- contact name status
- email status
- phone status

---

## Site identity

Show:

- submitted address
- verified/standardized address
- latitude/longitude
- match metadata
- PreciselyID if available

---

## Property intelligence

Show normalized property/building/parcel information.

---

## Jurisdiction context

Show useful jurisdiction and AHJ/PSAP context.

Include disclaimer that this does not determine permitting requirements.

---

## Site context

Show optional time zone / places context.

---

## Operating area

Show:

- inside/outside
- straight-line distance
- configured threshold

If actual routing available:
- travel/drive distance
- travel time
- separate Precisely provenance

---

## Information requiring field verification

Display the engineering/site gaps.

---

## Next best action

Examples:

SCHEDULE FIELD SURVEY

CORRECT INSTALLATION ADDRESS

SEND TO MANUAL DATA REVIEW

ROUTE TO OUT-OF-AREA SALES PROCESS

---

# 28. API

Implement:

POST /api/assessment

Prefer a streaming response if it remains maintainable.

If streaming is implemented, stream newline-delimited JSON or another simple documented format.

Possible event shapes:

{ "type": "trace", ... }

{ "type": "result", ... }

{ "type": "error", ... }

The frontend should update Agent Activity while execution progresses.

If reliable streaming significantly complicates the implementation, a normal POST returning result + trace is acceptable.

Correctness is more important than animation.

---

# 29. HEALTH ENDPOINTS

GET /api/health

Returns app status.

GET /api/mcp/health

Returns safe MCP diagnostics:

- configured mode
- connected yes/no
- discovered capability count
- required capability availability
- optional capability availability

Never return credentials.

---

# 30. MCP VERIFICATION SCRIPT

Create:

scripts/verify-mcp.ts

It should:

1. connect to configured MCP endpoint
2. initialize session
3. list available tools
4. print a readable capability report
5. identify whether each InstallIQ-required capability is available
6. exit nonzero only for required connection/setup failure

Also create:

scripts/print-mcp-tools.ts

which prints tool names and descriptions for debugging.

Do not print authentication headers.

---

# 31. ENVIRONMENT VARIABLES

Create `.env.example`.

Support conceptually:

INSTALLIQ_DATA_MODE=mock|local|hosted

PRECISELY_MCP_URL=

PRECISELY_API_KEY=

PRECISELY_API_SECRET=

SERVICE_BASE_LATITUDE=

SERVICE_BASE_LONGITUDE=

SERVICE_RADIUS_MILES=

Optional:

OPENAI_API_KEY=

Never commit real secrets.

Validate server-side environment variables.

Mock mode should require no secrets.

---

# 32. DEFAULT SERVICE AREA

Use configurable values.

Do not bury constants inside UI components.

For demo purposes, provide sensible Phoenix-region example values in `.env.example` comments or README instructions.

Clearly identify them as InstallIQ demo configuration, not Precisely data.

---

# 33. NORMALIZATION

Precisely APIs/MCP responses may differ across capabilities.

Do not allow vendor response shapes to leak throughout React components.

Each skill must normalize its result.

For unknown response variants:

- use defensive parsing
- preserve safe raw evidence
- return unavailable/unknown instead of crashing

Do not guess semantic meanings from unfamiliar field names.

---

# 34. ERROR HANDLING

Create typed error categories:

- McpConnectionError
- McpAuthenticationError
- CapabilityUnavailableError
- ToolExecutionError
- InvalidToolResponseError
- AssessmentPolicyError

Expected behavior:

MCP unavailable before assessment:
- UI shows clear connectivity error.

One optional capability unavailable:
- assessment continues.

Address resolution capability fails:
- assessment stops safely.

Property enrichment error after valid location:
- mark evidence error
- likely MANUAL_DATA_REVIEW depending on severity.

No property data:
- distinguish `not_found` from system `error`.

---

# 35. TIMEOUTS AND RETRIES

Add bounded timeouts.

Do not let one tool request hang indefinitely.

Use conservative retry behavior:

- retry transient network failures at most a small number of times
- do not aggressively retry validation failures or 4xx authentication failures

Trace retries safely.

---

# 36. LOGGING

Implement structured development logs.

Redact:

- API key
- API secret
- Authorization header

Avoid logging complete phone/email values unnecessarily.

Never log hidden LLM reasoning.

---

# 37. SECURITY

Requirements:

- Precisely credentials server-side only
- no secrets committed
- no credentials returned through APIs
- no authorization header logging
- no `dangerouslySetInnerHTML` for generated content
- Zod validate incoming requests
- sanitize display values through React defaults
- limit request field lengths
- no arbitrary MCP tool name supplied by browser clients
- client sends business request; server determines tools

This last point is important.

The browser must not be allowed to issue arbitrary MCP operations.

---

# 38. PERFORMANCE

Where dependencies allow, after successful location resolution execute independent site enrichment calls concurrently.

Example:

Promise.allSettled([
  property skill,
  jurisdiction skill,
  site-context skill,
  service-area skill
])

Do not parallelize calls that depend on unresolved data.

Use allSettled semantics so an optional enrichment failure does not destroy other successful evidence.

---

# 39. TESTING

Tests are mandatory.

## Unit tests

Test at least:

- Zod request validation
- readiness policy
- address-failure stopping rule
- outside-service-area rule
- property-partial-data behavior
- Haversine/service-area calculation
- redaction logic
- capability mapping
- normalized Evidence construction

---

## Skill tests

Use mocked PreciselyClient.

Test:

- contact skill
- address skill
- property skill
- jurisdiction skill
- optional capability unavailable

---

## Agent tests

Verify tool-selection behavior.

Important scenarios:

### Scenario A
Valid address + site data

Expected:
FIELD_SURVEY_REQUIRED

### Scenario B
Address cannot resolve

Expected:
ADDRESS_CORRECTION_REQUIRED

Verify property/jurisdiction skills are NOT run.

### Scenario C
Address resolves but property services fail

Expected:
MANUAL_DATA_REVIEW where policy requires.

### Scenario D
Site outside configured radius

Expected:
OUTSIDE_SERVICE_AREA

---

## E2E

Using mock mode:

1. open app
2. load demo request
3. run assessment
4. verify activity timeline
5. verify result cards
6. verify FIELD_SURVEY_REQUIRED
7. verify DEMO FIXTURE badge
8. verify evidence source UI

Create one E2E test for invalid-address flow if practical.

---

# 40. LIVE SMOKE TEST

Do NOT run live Precisely integration tests in ordinary CI.

Create an opt-in command such as:

npm run test:live

It should skip unless required environment variables exist.

Live smoke test should perform a low-risk operation, preferably:

- MCP health / tool discovery
- one address verification/geocoding request

Never create large batches.

---

# 41. README

README must contain:

1. product overview
2. business problem
3. architecture
4. screenshots placeholder/instructions if screenshots aren't generated
5. prerequisites
6. mock-mode quick start
7. live Precisely MCP setup
8. local MCP setup
9. hosted MCP setup
10. environment variables
11. commands
12. testing
13. demo procedure
14. known limitations
15. trusted-data vs reasoning explanation

README should state plainly:

InstallIQ is a prototype demonstrating how Precisely MCP capabilities can be composed into an agentic pre-site workflow.

---

# 42. LOCAL PRECISELY MCP SETUP DOCUMENT

Create `docs/live-setup.md`.

Document the workflow without committing Precisely source code into this project.

The developer should be able to:

1. clone Precisely's official `PreciselyData/precisely-mcp-servers` repository
2. enter its Locate MCP implementation directory
3. install its documented dependencies
4. configure `PRECISELY_API_KEY` and `PRECISELY_API_SECRET`
5. start its HTTP transport
6. configure InstallIQ to connect to its MCP endpoint
7. run `npm run mcp:verify`

Do not duplicate large amounts of Precisely documentation.

Point developers to official documentation/repository names.

---

# 43. CAPABILITY MAP DOCUMENT

Create:

docs/precisely-capability-map.md

Use a table:

InstallIQ skill | Semantic capability | MCP implementation | Required? | Business purpose

Example:

Address Resolution | address verification | discovered Precisely MCP tool/action | yes | establish physical site identity

Address Resolution | geocoding | discovered Precisely MCP tool/action | yes | coordinates

Property Intelligence | property attributes | discovered Precisely MCP tool/action | optional-but-important | site context

Jurisdiction Context | AHJ/PSAP | discovered Precisely MCP tool/action | optional | jurisdictional context

Service Area | local Haversine using Precisely coordinates | InstallIQ | yes | configured operational boundary

Clearly distinguish:

- Precisely-provided facts
- InstallIQ-derived calculations
- human-required information

---

# 44. ARCHITECTURE DOCUMENT

Create Mermaid diagram roughly representing:

User
  ↓
Next.js UI
  ↓
Assessment API
  ↓
Site Readiness Agent
  ↓
Skills
  ↓
PreciselyClient abstraction
  ↓
MCP
  ↓
Precisely Data / APIs

Also show:

Policy Engine

Mock Adapter

Evidence/Trace

---

# 45. DEMO SCRIPT

Create docs/demo-script.md.

Target length:
approximately 5 minutes.

Flow:

### 0:00–0:30
Problem:

"Before sending an engineer to an EV installation site, can we establish trustworthy location and property context digitally?"

### 0:30–1:00
Explain architecture briefly.

### 1:00–3:15
Run live/demo assessment.

Draw attention to agent activity.

### 3:15–4:15
Explain result.

Focus on:

- verified site
- property intelligence
- jurisdiction
- field information gaps
- next-best-action

### 4:15–5:00
Explain design decision:

"The system never asks the model to invent physical site facts. Precisely provides trusted evidence; the agent decides what information is needed and what should happen next."

Finish with business hypothesis:

- reduce avoidable pre-survey work
- improve field preparation
- shorten request-to-survey cycle
- make data provenance auditable

Do not claim unmeasured financial savings as fact.

---

# 46. UI QUALITY BAR

This is an interview artifact.

The UI must not look like a default tutorial.

Requirements:

- responsive desktop-first layout
- strong information hierarchy
- consistent spacing
- restrained visual design
- accessible contrast
- clear success/warning/error treatment
- loading states
- disabled submit while running
- useful empty state
- no huge walls of JSON
- raw data available only through expandable evidence view

Use icons sparingly.

Avoid excessive gradients and AI clichés.

---

# 47. ACCESSIBILITY

Required:

- semantic form labels
- keyboard-accessible controls
- status messaging
- aria-live where appropriate for assessment progress
- visible focus styles
- no color-only state distinction

---

# 48. FEATURE PRIORITY

P0 — absolutely required:

- request form
- mock adapter
- MCP adapter
- MCP health
- ContactValidationSkill
- AddressResolutionSkill
- PropertyIntelligenceSkill
- JurisdictionContextSkill
- ServiceAreaSkill
- SiteReadinessAgent
- conditional stopping
- trace/provenance
- result dashboard
- tests
- README
- live setup docs

P1 — implement after P0:

- places context
- time zone
- streaming agent activity
- hosted MCP action-gateway adapter
- richer raw evidence UI

P2 — only if P0/P1 are stable:

- route/travel-time integration
- map visualization
- optional LLM summary
- downloadable report

Do not sacrifice P0 reliability to build P2.

---

# 49. NON-GOALS

Do not implement:

- login/accounts
- payments
- database
- CRM
- real scheduling
- dispatch system
- permitting database
- electrical-load calculations
- utility load-flow calculations
- automated installation approval
- autonomous quoting
- production-grade multitenancy
- unnecessary microservices
- vector database
- RAG system

---

# 50. REQUIRED DEMONSTRATION OF AGENTIC BEHAVIOR

The following must be visible either in tests or UI:

If address resolution fails:

Property intelligence must NOT run.

If address resolution succeeds:

Relevant enrichment becomes eligible.

If an optional capability is unavailable:

Agent continues.

If site is out of range:

Agent returns OUTSIDE_SERVICE_AREA.

The trace must expose these observable decisions.

This prevents the application from being merely a fixed API chain.

---

# 51. PRECISELY FAILURE HONESTY

Never hide a Precisely failure.

Examples:

Correct:
"Property enrichment unavailable — MCP tool returned an error."

Correct:
"No parcel result returned."

Incorrect:
"Commercial property — 120,000 sq ft"

when that value came from a fixture after a live call failed.

A failure during a live interview is preferable to presenting fabricated data.

---

# 52. DEFINITION OF DONE

The implementation is complete only when all applicable checks pass:

- npm install
- npm run lint
- npm run typecheck
- npm test
- npm run build
- Playwright core path
- mock-mode application starts successfully
- MCP health endpoint works in mock mode
- no secrets exist in repository
- README contains complete setup
- AGENTS.md exists
- architecture documentation exists
- demo script exists
- live MCP verification command exists
- failure states are implemented
- provenance is visible
- mock/live state is visible
- address failure prevents downstream property calls

If live Precisely credentials are unavailable, the project can still be considered code-complete when:

- mock mode passes all checks
- MCP adapter is implemented
- MCP connection verification script exists
- live setup is documented
- only the credential-dependent smoke test remains unexecuted

Document that fact truthfully.

---

# 53. FINAL CODEX COMPLETION REPORT

When implementation is finished, produce a concise report containing:

## Implemented

List completed functionality.

## Architecture

Summarize agent → skills → MCP flow.

## Precisely capabilities

List actual capabilities integrated.

Do not list ones that were not implemented.

## Verification

Report exact commands run and results.

## Live integration status

State one of:

- live MCP verified
- live MCP configured but not verified
- mock only because credentials unavailable

## Remaining limitations

Be explicit.

## Demo commands

Give exact commands needed to start:

1. Precisely MCP if applicable
2. InstallIQ
3. browser URL
4. demo procedure

---

# 54. IMPLEMENTATION PRINCIPLE

When choosing between:

more features

and

a smaller system whose behavior is trustworthy and explainable,

choose the smaller trustworthy system.

The interviewer should be able to understand:

what the agent decided,
which skill ran,
which Precisely capability supplied a fact,
what remains unknown,
and why the next action was selected.

That is the central design requirement.