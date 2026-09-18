"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { AssessmentResult, EvStation } from "@/lib/domain/assessment";
import { groupChargingLocations } from "@/lib/domain/charging-locations";
import { Button } from "./ui/button";
import { Frame } from "./ui/frame";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

function reported(value?: string | number) {
  if (value === undefined) return undefined;
  const text = String(value).trim();
  return !text || ["-1", "-1.0", "not reported", "unavailable", "unknown", "n/a", "source did not provide a normalized confidence value."].includes(text.toLowerCase()) ? undefined : text;
}

function squareFeet(value?: string) {
  const raw = reported(value);
  if (!raw) return undefined;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? `${numeric.toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft` : raw;
}

type RecordRow = { field: string; value?: string | number; source: string };
type RecordGroup = { title: string; rows: RecordRow[] };

function siteRecordGroups(result: AssessmentResult): RecordGroup[] {
  const { location, property, jurisdiction, siteContext, serviceArea } = result;
  const routeAvailable = serviceArea?.routeAvailable === true;
  const distance = serviceArea?.distanceMiles;
  const coordinates = location.latitude !== undefined && location.longitude !== undefined ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : undefined;
  const serviceDecision = serviceArea?.inside === undefined ? undefined : serviceArea.inside ? "Inside configured area" : "Outside configured area";
  return [
    { title: "Site identity", rows: [
      { field: "Submitted address", value: location.submittedAddress, source: "Request" },
      { field: "Standardized address", value: location.standardizedAddress, source: "Precisely" },
      { field: "Coordinates", value: coordinates, source: "Precisely" },
      { field: "Match score", value: location.matchMetadata, source: "Precisely" },
      { field: "Precisely ID", value: location.preciselyId, source: "Precisely" },
      { field: "Parcel reference", value: location.parcelReference, source: "Precisely" },
      { field: "Elevation", value: location.elevation, source: "Precisely" },
    ] },
    { title: "Service area", rows: [
      { field: "Result", value: serviceDecision, source: "InstallIQ" },
      { field: "Decision metric", value: routeAvailable ? "Driving route" : "Straight-line fallback", source: "InstallIQ" },
      { field: "Decision distance", value: distance === undefined ? undefined : `${distance.toFixed(1)} mi`, source: routeAvailable ? "Precisely" : "InstallIQ" },
      { field: "Drive time", value: routeAvailable && serviceArea?.travelMinutes !== undefined ? `${Math.round(serviceArea.travelMinutes)} min` : undefined, source: "Precisely" },
      { field: "Straight-line reference", value: serviceArea?.straightLineMiles === undefined ? undefined : `${serviceArea.straightLineMiles.toFixed(1)} mi`, source: "InstallIQ" },
      { field: "Service boundary", value: serviceArea?.thresholdMiles === undefined ? undefined : `${serviceArea.thresholdMiles} mi`, source: "InstallIQ" },
    ] },
    { title: "Jurisdiction", rows: [
      { field: "Tax jurisdiction", value: jurisdiction?.taxJurisdiction, source: "Precisely" },
      { field: "AHJ", value: jurisdiction?.ahj, source: "Precisely" },
      { field: "Timezone", value: siteContext?.timeZone, source: "Precisely" },
    ] },
    { title: "Property", rows: [
      { field: "Property use", value: property?.propertyType, source: "Precisely" },
      { field: "Building footprint", value: squareFeet(property?.buildingArea), source: "Precisely" },
      { field: "Building count", value: property?.buildingCount, source: "Precisely" },
      { field: "Year built", value: property?.yearBuilt, source: "Precisely" },
      { field: "Parcel ID", value: property?.parcelId, source: "Precisely" },
      { field: "Parcel area", value: squareFeet(property?.lotArea), source: "Precisely" },
      { field: "Roof type", value: property?.roofType, source: "Precisely" },
      { field: "Roof condition", value: property?.roofCondition, source: "Precisely" },
      { field: "Solar-panel area", value: squareFeet(property?.solarPanelArea), source: "Precisely" },
    ] },
  ];
}

export function SiteRecord({ result }: { result: AssessmentResult }) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const groups = siteRecordGroups(result);

  return <section className="site-record" aria-label="Site record">
    <div className="record-accordion">
      {groups.map((group, index) => {
        const isOpen = openSection === group.title;
        const panelId = `record-section-${index + 1}`;
        const headingId = `${panelId}-heading`;
        return <Frame className="record-frame" key={group.title}>
          <h2 className="record-section-heading">
            <Button
              id={headingId}
              type="button"
              variant="ghost"
              className="record-section-toggle"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenSection(isOpen ? null : group.title)}
            >
              <span className="record-section-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="record-section-name">{group.title}</span>
              <span className="record-section-count">{group.rows.length} fields</span>
              <ChevronDown className="record-section-chevron" size={17} aria-hidden="true" />
            </Button>
          </h2>
          <div id={panelId} className="record-section-content" role="region" aria-labelledby={headingId} hidden={!isOpen}>
            <Table variant="card" className="record-data-table">
              <colgroup><col className="record-field-column" /><col /><col className="record-source-column" /></colgroup>
              <TableHeader><TableRow><TableHead scope="col">Field</TableHead><TableHead scope="col">Value</TableHead><TableHead scope="col">Source</TableHead></TableRow></TableHeader>
              <TableBody>{group.rows.map((row) => {
                const value = reported(row.value);
                return <TableRow key={row.field} isBodyRow>
                  <TableCell>{row.field}</TableCell>
                  <TableCell className={value ? "record-value" : "record-value not-reported"}>{value ?? "Not reported"}</TableCell>
                  <TableCell className={value ? "record-source" : "record-source not-reported"}>{value ? row.source : "—"}</TableCell>
                </TableRow>;
              })}</TableBody>
            </Table>
          </div>
        </Frame>;
      })}
    </div>
  </section>;
}

function connectors(station: EvStation) {
  return [station.connectorTypes?.join(", "), station.dcFastPorts ? `${station.dcFastPorts} DC fast` : undefined, station.level2Ports ? `${station.level2Ports} L2` : undefined].filter(Boolean).join(" · ") || "Not reported";
}

export function NearbyCharging({ result, onViewMap }: { result: AssessmentResult; onViewMap?: () => void }) {
  const { evInfrastructure } = result;
  const locations = groupChargingLocations(evInfrastructure?.stations ?? []);
  const pinByStationId = new Map(locations.flatMap((location, index) => location.stations.map((station) => [station.id, index + 1] as const)));
  return <section className="nearby-charging" aria-label="Nearby public charging">
    <div className="report-section-heading"><h2>Nearby public charging</h2>{locations.length > 0 && onViewMap && <Button variant="outline" size="sm" onClick={onViewMap}>View pins on main map ↑</Button>}</div>
    {!evInfrastructure?.enabled || evInfrastructure.unavailable ? <p className="not-reported">{evInfrastructure?.message ?? "Not reported"}</p> : evInfrastructure.stations.length === 0 ? <p className="not-reported">No public stations returned within {evInfrastructure.searchRadiusMiles} mi.</p> : <>
      <p className="charging-map-note">{locations.length > 0 ? `${locations.length} numbered location${locations.length === 1 ? "" : "s"} on the main map. Pins use AFDC coordinates; exact charger placement is not verified.` : "Station coordinates were not retained in this assessment. Run it again to show pins on the main map."}</p>
      <div className="charging-table-wrap"><table className="charging-table"><thead><tr><th>Name</th><th>Address</th><th>Network</th><th>Connectors</th><th>Distance</th><th>Confirmed</th></tr></thead><tbody>{evInfrastructure.stations.map((station) => <tr key={station.id}>
        <td>{pinByStationId.has(station.id) && <span className="charging-pin-index" title={`Map pin ${pinByStationId.get(station.id)}`}>{pinByStationId.get(station.id)}</span>}{station.name}</td>
        <td>{station.address ?? <span className="not-reported">Not reported</span>}</td>
        <td>{station.network ?? <span className="not-reported">Not reported</span>}</td>
        <td>{connectors(station)}</td>
        <td>{station.distanceMiles === undefined ? <span className="not-reported">Not reported</span> : `${station.distanceMiles.toFixed(1)} mi`}</td>
        <td>{station.lastConfirmed ?? <span className="not-reported">Not reported</span>}</td>
      </tr>)}</tbody></table></div>
    </>}
  </section>;
}

export function DetailedSiteReport({ result }: { result: AssessmentResult }) {
  return <><SiteRecord result={result} /><NearbyCharging result={result} /></>;
}
