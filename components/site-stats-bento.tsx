import type { AssessmentResult } from "@/lib/domain/assessment";

function squareFeet(value?: string) { if (!value) return "—"; const numeric = Number(value); return Number.isFinite(numeric) ? `${numeric.toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft` : value; }

export function SiteStatsBento({ result }: { result: AssessmentResult }) {
  const route = result.serviceArea;
  const publicEv = result.evInfrastructure;
  const nearestStation = publicEv?.stations.reduce<number | undefined>((nearest, station) => {
    if (typeof station.distanceMiles !== "number") return nearest;
    return nearest === undefined ? station.distanceMiles : Math.min(nearest, station.distanceMiles);
  }, undefined);
  const routeValue = route?.routeAvailable ? `${route.routeDistanceMiles?.toFixed(1)} mi` : `${route?.straightLineMiles?.toFixed(1) ?? "—"} mi`;
  return <section className="site-stats-bento" aria-label="Key site facts">
    <article className="bento-stat route"><span>Travel context</span><strong>{routeValue}</strong><small>{route?.routeAvailable ? `${Math.round(route.travelMinutes ?? 0)} min drive via Precisely` : "Straight-line fallback"}</small></article>
    <article className="bento-stat area"><span>Building footprint</span><strong>{squareFeet(result.property?.buildingArea)}</strong><small>Precisely property structure</small></article>
    <article className="bento-stat charging"><span>Public charging nearby</span><strong>{publicEv?.enabled && !publicEv.unavailable ? `${publicEv.stations.length} station${publicEv.stations.length === 1 ? "" : "s"}` : "Not returned"}</strong><small>{nearestStation !== undefined ? `${nearestStation.toFixed(1)} mi nearest · AFDC` : "Public-inventory context only"}</small></article>
    <article className="bento-stat ahj"><span>AHJ context</span><strong>{result.jurisdiction?.ahj ?? "—"}</strong><small>{result.jurisdiction?.taxJurisdiction ?? "Jurisdiction not returned"}</small></article>
  </section>;
}
