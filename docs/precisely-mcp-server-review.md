# Precisely MCP server review

Reviewed against InstallIQ's scope: trusted digital pre-site intelligence, not electrical design, permit approval, or a general data-management platform.

| Server | Review | Decision for InstallIQ |
| --- | --- | --- |
| Data Integrity Suite hosted MCP (`precisely-dis-mcp`) | Hosted action gateway exposes dynamic semantic discovery, descriptions, schema validation, and action execution. Current credentials already connect to this platform. | **Use as the primary Precisely integration.** It covers address, geocode, property, roof, tax, emergency/AHJ, timezone, physical-place proximity, and routing capabilities when enabled in the tenant catalog. |
| DIS / Locate APIs v2 (`precisely-dis-locate`) | Active local server with a large location tool surface, but overlaps the hosted DIS location actions and requires operating a Python server and its dependencies. | **Do not add for this prototype.** It would duplicate the active hosted integration without adding a separate source of truth. |
| Geographic Addressing SDK (`precisely-ga-sdk`) | Local licensed SDK runtime for address verify/geocode. | **Do not add.** It duplicates hosted address verification and requires a separate SDK/reference-data installation. |
| GeoTAX SDK (`precisely-geotax-sdk`) | Adds detailed tax-rate lookups but requires a separate local GeoTAX SDK service and license. | **Future optional integration.** Useful only if tax-rate economics becomes an explicit business requirement; it does not determine permitting or EV feasibility. |
| MapInfo Pro (`precisely-mapinfo-pro`) | Desktop MapInfo Pro automation and map/layout tooling, with its own desktop installation and beta server. | **Do not add to the web backend.** It is appropriate for analyst-authored map packages, not a request-time browser dashboard. |
| Spectrum, Trillium, Analyze, DQ+, Enterworks, Matching, Connect | Enterprise data-quality, matching, catalog, ETL, and governance capabilities with separate runtimes/tenants. | **Out of scope for the request-time assessment.** Consider them later for CRM/master-data workflows, not for live site facts. |

The selected architecture intentionally uses one governed Precisely action gateway instead of connecting multiple overlapping MCP servers. Every additional source must have a distinct business purpose and a visible evidence label. AFDC public EV-station inventory is therefore connected separately as HTTPS data, not presented as Precisely data.
