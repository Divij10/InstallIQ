import type { AssessmentResult, EvStation } from "@/lib/domain/assessment";

function reported(value?: string | number) {
  return value === undefined || value === "" || value === "-1" || value === "-1.0" || value === "Source did not provide a normalized confidence value." ? undefined : String(value);
}

function squareFeet(value?: string) {
  const raw = reported(value);
  if (!raw) return undefined;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? `${numeric.toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft` : raw;
}

function Cell({ label, value }: { label: string; value?: string | number }) {
  const present = reported(value);
  return <div className="record-row"><dt>{label}</dt><dd className={present ? undefined : "not-reported"}>{present ?? "Not reported"}</dd></div>;
}

function Group({ title }: { title: string }) {
  return <div className="record-group"><span>{title}</span></div>;
}

function connectors(station: EvStation) {
  return [station.connectorTypes?.join(", "), station.dcFastPorts ? `${station.dcFastPorts} DC fast` : undefined, station.level2Ports ? `${station.level2Ports} L2` : undefined].filter(Boolean).join(" · ") || "Not reported";
}

export function SiteRecord({ result }: { result: AssessmentResult }) {
  const { location, property, jurisdiction, siteContext, serviceArea, evInfrastructure } = result;
  const routeAvailable = serviceArea?.routeAvailable === true;
  const distance = serviceArea?.distanceMiles;
  const coordinates = location.latitude !== undefined && location.longitude !== undefined ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : undefined;
  const serviceDecision = serviceArea?.inside === undefined ? undefined : serviceArea.inside ? "Inside configured service area" : "Outside configured service area";
  return <section className="site-record" aria-label="Site record">
    <div className="report-section-heading"><div className="eyebrow">SITE RECORD</div><h3>Site record</h3><p>Normalized fields returned for this assessment.</p></div>
    <div className="record-sections">
      <dl className="record-table">
        <Group title="Site identity" />
        <Cell label="Submitted address" value={location.submittedAddress} /><Cell label="Standardized address" value={location.standardizedAddress} /><Cell label="Coordinates" value={coordinates} /><Cell label="Match score" value={location.matchMetadata} /><Cell label="Precisely ID" value={location.preciselyId} /><Cell label="Parcel reference" value={location.parcelReference} /><Cell label="Elevation" value={location.elevation} />
      </dl>
      <dl className="record-table">
        <Group title="Service area" />
        <Cell label="Service-area result" value={serviceDecision} /><Cell label="Decision metric" value={routeAvailable ? "Precisely driving route" : "Straight-line fallback"} /><Cell label="Fallback distance" value={routeAvailable ? undefined : distance === undefined ? undefined : `${distance.toFixed(1)} mi`} /><Cell label="Drive time" value={routeAvailable && serviceArea?.travelMinutes !== undefined ? `${Math.round(serviceArea.travelMinutes)} min` : undefined} /><Cell label="Straight-line reference" value={serviceArea?.straightLineMiles === undefined ? undefined : `${serviceArea.straightLineMiles.toFixed(1)} mi`} /><Cell label="Service boundary" value={serviceArea?.thresholdMiles === undefined ? undefined : `${serviceArea.thresholdMiles} mi`} />
      </dl>
      <dl className="record-table">
        <Group title="Jurisdiction" />
        <Cell label="Tax jurisdiction" value={jurisdiction?.taxJurisdiction} /><Cell label="AHJ" value={jurisdiction?.ahj} /><Cell label="Timezone" value={siteContext?.timeZone} />
      </dl>
      <dl className="record-table record-property">
        <Group title="Property" />
        <Cell label="Property use" value={property?.propertyType} /><Cell label="Building footprint" value={squareFeet(property?.buildingArea)} /><Cell label="Building count" value={property?.buildingCount} /><Cell label="Year built" value={property?.yearBuilt} /><Cell label="Parcel ID" value={property?.parcelId} /><Cell label="Parcel area" value={squareFeet(property?.lotArea)} /><Cell label="Roof type" value={property?.roofType} /><Cell label="Roof condition" value={property?.roofCondition} /><Cell label="Solar-panel area" value={squareFeet(property?.solarPanelArea)} />
      </dl>
    </div>
  </section>;
}

export function NearbyCharging({ result }: { result: AssessmentResult }) {
  const { evInfrastructure } = result;
  return <section className="nearby-charging" aria-label="Nearby public charging">
      <div className="report-section-heading"><div className="eyebrow">PUBLIC INFRASTRUCTURE</div><h3>Nearby public charging</h3></div>
      {!evInfrastructure?.enabled || evInfrastructure.unavailable ? <p className="not-reported">{evInfrastructure?.message ?? "Not reported"}</p> : evInfrastructure.stations.length === 0 ? <p className="not-reported">No public stations returned within {evInfrastructure.searchRadiusMiles} mi.</p> : <div className="charging-table-wrap"><table className="charging-table"><thead><tr><th>Name</th><th>Address</th><th>Network</th><th>Connectors</th><th>Distance</th><th>Confirmed</th></tr></thead><tbody>{evInfrastructure.stations.map((station) => <tr key={station.id}><td>{station.name}</td><td>{station.address ?? <span className="not-reported">Not reported</span>}</td><td>{station.network ?? <span className="not-reported">Not reported</span>}</td><td>{connectors(station)}</td><td>{station.distanceMiles === undefined ? <span className="not-reported">Not reported</span> : `${station.distanceMiles.toFixed(1)} mi`}</td><td>{station.lastConfirmed ?? <span className="not-reported">Not reported</span>}</td></tr>)}</tbody></table></div>}
  </section>;
}

export function DetailedSiteReport({ result }: { result: AssessmentResult }) {
  return <><SiteRecord result={result} /><NearbyCharging result={result} /></>;
}
