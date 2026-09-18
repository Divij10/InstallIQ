# Precisely capability map

InstallIQ addresses Precisely through internal capability names, never raw tool names. In hosted mode each capability is bound to one approved DIS action ID; the gateway's semantic search must return that exact action before InstallIQ will execute it. In local mode the same capability is matched against a locally discovered tool name.

| InstallIQ skill | Capability | Approved hosted action | Required? | Business purpose |
|---|---|---|---|---|
| Address suggestions (`/api/address-suggestions`) | `ADDRESS_AUTOCOMPLETE` | `geo_addressing.autocomplete` | Optional | Reduce mistyped intake addresses |
| Address Resolution | `ADDRESS_VERIFY` | `geo_addressing.verify_address` | Yes | Establish physical site identity |
| Address Resolution | `ADDRESS_GEOCODE` | `geo_addressing.geocode` | Yes | Obtain coordinates and the Precisely ID |
| Property Intelligence | `PROPERTY_ATTRIBUTES`, `BUILDING_INFORMATION`, `PARCEL_INFORMATION`, `ROOF_ATTRIBUTES` | `property.structure`, `property.buildings`, `property.parcels`, `property.roof_attributes` | Optional but important | Site context, keyed to the Precisely ID so every field describes the same site |
| Jurisdiction Context | `TAX_JURISDICTION`, `AUTHORITY_HAVING_JURISDICTION` | `tax.jurisdiction`, `emergency.services` | Optional | Location context, not permit status |
| Site Context | `TIMEZONE` | `timezone.lookup` | Optional | Timezone context |
| Service Area | `ROUTE_OR_TRAVEL_TIME` | `routing.directions` | Yes | Configured operating boundary; Haversine remains a transparent fallback |

The `PreciselyCapability` union in `lib/precisely/types.ts` is the single source of truth for this list. Adding a capability means adding it there, mapping it to an approved action in `lib/precisely/action-gateway-adapter.ts`, giving it a search goal and an input transform, and adding a local alias in `lib/precisely/capability-registry.ts`.

Precisely supplies facts where available. InstallIQ supplies orchestration, safe stopping rules, the operating-area policy, the evidence-coverage index, and the next best action. AFDC is an additional non-MCP public source for existing public EV-station context, deliberately reported separately from Precisely facts. Field inspection and external authorities remain responsible for engineering, permitting, utility, and physical-site facts.
