# Precisely capability map

| InstallIQ skill | Semantic capability | MCP implementation | Required? | Business purpose |
|---|---|---|---|---|
| Address Resolution | Address verification | Runtime-discovered direct tool/action | Yes | Establish physical site identity |
| Address Resolution | Geocoding | Runtime-discovered direct tool/action | Yes | Obtain coordinates |
| Contact Validation | Name/email/phone validation | Runtime-discovered optional tools | Optional | Contact usability |
| Property Intelligence | Property/building/parcel | Runtime-discovered optional tools | Optional but important | Site context |
| Jurisdiction Context | Tax and AHJ/PSAP | Runtime-discovered optional tools | Optional | Location context, not permit status |
| Site Context | Timezone and physical places | `timezone.lookup`, `address_proximity.search` via hosted DIS action gateway | Optional | Timezone and nearby commercial-place context |
| Service Area | Traffic-aware driving route | `routing.directions` via hosted DIS action gateway | Yes | Configured operating boundary; Haversine remains transparent fallback |

Precisely supplies facts where available. InstallIQ supplies orchestration, safe stopping rules, the operating-area policy, and next best action. AFDC is an additional non-MCP public source for existing public EV-station context, deliberately reported separately from Precisely facts. Field inspection and external authorities remain responsible for engineering, permitting, utility, and physical-site facts.
