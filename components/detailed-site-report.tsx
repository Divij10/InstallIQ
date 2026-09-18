import type { AssessmentResult } from "@/lib/domain/assessment";

function reported(value?: string | number) {
  if (value === undefined || value === "" || value === "-1" || value === "-1.0" || value === "Source did not provide a normalized confidence value.") return "Not reported";
  return value;
}

function squareFeet(value?: string) {
  if (!value || value === "-1" || value === "-1.0") return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft` : value;
}

function Fact({ label, value, detail }: { label: string; value?: string | number; detail?: string }) {
  return <div className="fact"><span>{label}</span><strong>{reported(value)}</strong>{detail && <small>{detail}</small>}</div>;
}

export function DetailedSiteReport({ result }: { result: AssessmentResult }) {
  const { location, property, jurisdiction, siteContext, serviceArea, evInfrastructure } = result;
  const routeAvailable = serviceArea?.routeAvailable === true;
  const distance = serviceArea?.distanceMiles;
  const threshold = serviceArea?.thresholdMiles;
  const variance = distance !== undefined && threshold !== undefined ? distance - threshold : undefined;
  const routeBasis = routeAvailable ? "Precisely driving route" : "Straight-line fallback";
  const serviceDecision = serviceArea?.inside === undefined ? undefined : serviceArea.inside ? "Inside configured service area" : "Outside configured service area";
  const boundaryDifference = variance === undefined ? undefined : variance === 0 ? "At the configured threshold" : `${Math.abs(variance).toFixed(1)} miles ${variance > 0 ? "beyond" : "inside"} the threshold`;
  const coordinates = location.latitude !== undefined && location.longitude !== undefined ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : undefined;

  return <section className="detailed-site-report" aria-label="Detailed digital site report">
    <div className="section-heading"><div><div className="eyebrow">DETAILED DIGITAL SITE REPORT</div><h3>What the connected data actually says</h3></div><span>Reported source facts, clearly separated from the InstallIQ operating-area calculation.</span></div>
    <div className="report-interpretation"><b>Decision basis</b><p>{routeAvailable ? "The operating-area result uses the Precisely driving-route distance, not a radius-only estimate." : "Precisely routing did not return a usable route, so InstallIQ used the clearly labelled straight-line-distance fallback."} This result does not establish electrical feasibility, permitting, utility approval, or installation cost.</p></div>
    <div className="report-grid">
      <article className="fact-card verified"><div className="fact-card-heading"><span>01</span><div><b>Verified site identity</b><small>Precisely address verification and geocoding</small></div></div><Fact label="Submitted address" value={location.submittedAddress} /><Fact label="Standardized address" value={location.standardizedAddress} /><Fact label="Coordinates" value={coordinates} /><Fact label="Address match score" value={location.matchMetadata} /><Fact label="Precisely ID" value={location.preciselyId} /><Fact label="Parcel reference" value={location.parcelReference} detail={location.parcelReference ? "Returned with address-verification data" : undefined} /><Fact label="Source elevation" value={location.elevation} /></article>
      <article className="fact-card calculated"><div className="fact-card-heading"><span>02</span><div><b>Operating-area decision</b><small>{routeBasis} + InstallIQ policy</small></div></div><Fact label="Service-area result" value={serviceDecision} /><Fact label="Decision metric" value={routeBasis} /><Fact label={routeAvailable ? "Driving-route distance" : "Fallback distance"} value={distance === undefined ? undefined : `${distance.toFixed(1)} miles`} /><Fact label="Estimated drive time" value={routeAvailable && serviceArea?.travelMinutes !== undefined ? `${Math.round(serviceArea.travelMinutes)} minutes` : undefined} /><Fact label="Straight-line reference" value={serviceArea?.straightLineMiles === undefined ? undefined : `${serviceArea.straightLineMiles.toFixed(1)} miles`} /><Fact label="Configured service boundary" value={threshold === undefined ? undefined : `${threshold} miles`} /><Fact label="Distance to boundary" value={boundaryDifference} /></article>
      <article className="fact-card context"><div className="fact-card-heading"><span>03</span><div><b>Local authority context</b><small>Precisely tax, emergency, and timezone actions</small></div></div><Fact label="Tax jurisdiction" value={jurisdiction?.taxJurisdiction} /><Fact label="AHJ / emergency context" value={jurisdiction?.ahj} /><Fact label="Timezone" value={siteContext?.timeZone} /><Fact label="Nearby-place context" value={siteContext?.places?.length ? siteContext.places.join(" · ") : undefined} /><p>{jurisdiction?.disclaimer ?? "Location context is not a permit determination."}</p></article>
      <article className="fact-card property-card"><div className="fact-card-heading"><span>04</span><div><b>Property and roof observations</b><small>Precisely property, building, parcel, and roof actions</small></div></div><Fact label="Property use" value={property?.propertyType} /><Fact label="Building footprint / area" value={squareFeet(property?.buildingArea)} /><Fact label="Number of buildings" value={property?.buildingCount} /><Fact label="Year built" value={property?.yearBuilt} /><Fact label="Parcel identifier" value={property?.parcelId} /><Fact label="Parcel area" value={squareFeet(property?.lotArea)} /><Fact label="Roof type" value={property?.roofType} /><Fact label="Roof condition" value={property?.roofCondition} /><Fact label="Solar-panel area" value={squareFeet(property?.solarPanelArea)} /></article>
      <article className="fact-card ev-infrastructure-card"><div className="fact-card-heading"><span>05</span><div><b>Existing public EV infrastructure</b><small>US AFDC inventory — nearby context, not feasibility</small></div></div>{!evInfrastructure?.enabled ? <p>Public EV-station inventory is not configured. Add <code>NREL_API_KEY</code> on the server to enable this source.</p> : evInfrastructure.unavailable ? <p>{evInfrastructure.message ?? "The public EV-station inventory was unavailable for this run."}</p> : evInfrastructure.stations.length === 0 ? <p>No public EV stations were returned within {evInfrastructure.searchRadiusMiles} miles. This is a source result, not a finding that the site is unsuitable for charging.</p> : <div className="station-list">{evInfrastructure.stations.slice(0, 4).map((station) => <div className="station" key={station.id}><div><b>{station.name}</b><small>{station.address ?? "Address not returned"}</small></div><span>{station.distanceMiles === undefined ? "Distance not returned" : `${station.distanceMiles.toFixed(1)} mi`}</span><p>{[station.network, station.dcFastPorts !== undefined ? `${station.dcFastPorts} DC fast` : undefined, station.level2Ports !== undefined ? `${station.level2Ports} Level 2` : undefined, station.connectorTypes?.join(", "), station.lastConfirmed ? `confirmed ${station.lastConfirmed}` : undefined].filter(Boolean).join(" · ") || "Network and port details not returned"}</p></div>)}</div>}</article>
    </div>
  </section>;
}
