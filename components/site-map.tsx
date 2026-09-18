"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AssessmentResult } from "@/lib/domain/assessment";
import { groupChargingLocations, type ChargingLocation } from "@/lib/domain/charging-locations";

let maps3dLoader: Promise<void> | undefined;

type GoogleMapsRuntime = {
  maps?: {
    Map?: new (element: HTMLElement, options: Record<string, unknown>) => TwoDimensionalMap;
    Marker?: new (options: Record<string, unknown>) => { setMap(map: null): void };
  };
};

type Bounds = { north: number; south: number; east: number; west: number };
type TwoDimensionalMap = { fitBounds(bounds: Bounds, padding?: number): void; setCenter(center: { lat: number; lng: number }): void; setZoom(zoom: number): void };
export type MapFocus = "site" | "chargers";

function stationBounds(latitude: number, longitude: number, locations: ChargingLocation[]): Bounds {
  const latitudes = [latitude, ...locations.map((location) => location.latitude)];
  const longitudes = [longitude, ...locations.map((location) => location.longitude)];
  return { north: Math.max(...latitudes), south: Math.min(...latitudes), east: Math.max(...longitudes), west: Math.min(...longitudes) };
}

const markerIcon = (fillColor: string) => ({
  path: "M 0,-10 a 10,10 0 1,1 0,20 a 10,10 0 1,1 0,-20",
  fillColor,
  fillOpacity: 1,
  strokeColor: "#101114",
  strokeWeight: 1,
  scale: 1,
});

function circleGraphic(label: string, fillColor: string) {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.setAttribute("viewBox", "0 0 24 24");
  const circle = document.createElementNS(svgNamespace, "circle");
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "12");
  circle.setAttribute("r", "10");
  circle.setAttribute("fill", fillColor);
  circle.setAttribute("stroke", "#101114");
  circle.setAttribute("stroke-width", "2");
  const text = document.createElementNS(svgNamespace, "text");
  text.setAttribute("x", "12");
  text.setAttribute("y", "12");
  text.setAttribute("fill", "#101114");
  text.setAttribute("font-family", "Arial, sans-serif");
  text.setAttribute("font-size", label.length > 1 ? "10" : "12");
  text.setAttribute("font-weight", "700");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "central");
  text.textContent = label;
  svg.append(circle, text);
  const template = document.createElement("template");
  template.content.append(svg);
  return template;
}

function create3dCircleMarker(latitude: number, longitude: number, label: string, fillColor: string, description: string) {
  const marker = document.createElement("gmp-marker-3d");
  marker.setAttribute("position", `${latitude},${longitude},5`);
  marker.setAttribute("altitude-mode", "relative-to-mesh");
  marker.setAttribute("collision-behavior", "required");
  marker.setAttribute("draws-when-occluded", "");
  marker.setAttribute("size-preserved", "");
  marker.setAttribute("z-index", label === "S" ? "100" : "10");
  marker.setAttribute("aria-label", description);
  marker.append(circleGraphic(label, fillColor));
  return marker;
}

function loadGoogleMaps3d(apiKey: string) {
  if (typeof window === "undefined" || window.customElements.get("gmp-map-3d")) return Promise.resolve();
  if (maps3dLoader) return maps3dLoader;
  maps3dLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-installiq-google-maps="true"]');
    if (existing) { existing.addEventListener("load", () => resolve(), { once: true }); existing.addEventListener("error", () => reject(new Error("Google Maps could not load.")), { once: true }); return; }
    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.dataset.installiqGoogleMaps = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=maps3d&v=weekly&loading=async`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps could not load."));
    document.head.append(script);
  });
  return maps3dLoader;
}

export function SiteMap({ result, compact = false, focus, onFocusChange }: { result: AssessmentResult; compact?: boolean; focus?: MapFocus; onFocusChange?: (focus: MapFocus) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const map3d = useRef<HTMLElement | null>(null);
  const map2d = useRef<TwoDimensionalMap | null>(null);
  const [state, setState] = useState<"loading" | "ready3d" | "ready2d" | "unavailable" | "error">("loading");
  const [localFocus, setLocalFocus] = useState<MapFocus>("site");
  const currentFocus = focus ?? localFocus;
  const changeFocus = onFocusChange ?? setLocalFocus;
  const latitude = result.location.latitude;
  const longitude = result.location.longitude;
  const stations = result.evInfrastructure?.stations;
  const locations = useMemo(() => groupChargingLocations(stations ?? []), [stations]);

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) { setState("unavailable"); return; }
    const canvas = document.createElement("canvas");
    const supports3d = Boolean(canvas.getContext("webgl2"));
    let cancelled = false;
    const markers: Array<{ setMap(map: null): void }> = [];
    async function renderMap() {
      if (latitude === undefined || longitude === undefined) return;
      try {
        const response = await fetch("/api/maps/config", { cache: "no-store" });
        const config = await response.json() as { enabled?: boolean; apiKey?: string };
        if (!config.enabled || !config.apiKey) { if (!cancelled) setState("unavailable"); return; }
        await loadGoogleMaps3d(config.apiKey);
        if (cancelled || !host.current) return;
        if (!supports3d) {
          const runtime = (window as typeof window & { google?: GoogleMapsRuntime }).google;
          if (!runtime?.maps?.Map || !runtime.maps.Marker) throw new Error("Google Maps 2D renderer is unavailable.");
          const center = { lat: latitude, lng: longitude };
          host.current.replaceChildren();
          const twoDimensionalMap = new runtime.maps.Map(host.current, {
            center,
            zoom: compact ? 20 : 18,
            mapTypeId: "hybrid",
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: "cooperative",
            backgroundColor: "#0c2135",
          });
          map2d.current = twoDimensionalMap;
          const Marker = runtime.maps.Marker;
          markers.push(new Marker({ map: twoDimensionalMap, position: center, title: "Assessed site", label: { text: "S", color: "#101114", fontWeight: "700" }, icon: markerIcon("#f4f4f5") }));
          locations.forEach((location, index) => {
            const title = location.stations.length === 1 ? location.stations[0].name : `${location.stations.length} AFDC station records: ${location.stations.map((station) => station.name).join(", ")}`;
            markers.push(new Marker({ map: twoDimensionalMap, position: { lat: location.latitude, lng: location.longitude }, title, label: { text: String(index + 1), color: "#101114", fontWeight: "700" }, icon: markerIcon("#5dd2c2") }));
          });
          if (!cancelled) setState("ready2d");
          return;
        }
        const map = document.createElement("gmp-map-3d");
        map.setAttribute("center", `${latitude},${longitude},500`);
        map.setAttribute("range", compact ? "420" : "1300");
        map.setAttribute("tilt", "62");
        map.setAttribute("heading", "18");
        map.setAttribute("mode", "HYBRID");
        map.setAttribute("default-ui-hidden", "true");
        map.append(create3dCircleMarker(latitude, longitude, "S", "#f4f4f5", "Assessed site"));
        locations.forEach((location, index) => {
          map.append(create3dCircleMarker(location.latitude, location.longitude, String(index + 1), "#5dd2c2", `${location.stations.length} AFDC public charging station record${location.stations.length === 1 ? "" : "s"}`));
        });
        host.current.replaceChildren(map);
        map3d.current = map;
        if (!cancelled) setState("ready3d");
      } catch { if (!cancelled) setState("error"); }
    }
    void renderMap();
    return () => { cancelled = true; markers.forEach((marker) => marker.setMap(null)); map2d.current = null; map3d.current = null; };
  }, [latitude, longitude, compact, locations]);

  useEffect(() => {
    if (latitude === undefined || longitude === undefined || (state !== "ready3d" && state !== "ready2d")) return;
    const showChargers = currentFocus === "chargers" && locations.length > 0;
    const bounds = stationBounds(latitude, longitude, locations);
    if (state === "ready3d" && map3d.current) {
      const centerLatitude = showChargers ? (bounds.north + bounds.south) / 2 : latitude;
      const centerLongitude = showChargers ? (bounds.east + bounds.west) / 2 : longitude;
      const latitudeMiles = (bounds.north - bounds.south) * 69;
      const longitudeMiles = (bounds.east - bounds.west) * 69 * Math.cos(centerLatitude * Math.PI / 180);
      const range = showChargers ? Math.max(1300, Math.min(28000, Math.hypot(latitudeMiles, longitudeMiles) * 1609 * 3.5)) : compact ? 420 : 1300;
      map3d.current.setAttribute("center", `${centerLatitude},${centerLongitude},500`);
      map3d.current.setAttribute("range", String(Math.round(range)));
      map3d.current.setAttribute("tilt", showChargers ? "45" : "62");
    }
    if (state === "ready2d" && map2d.current) {
      if (showChargers && (bounds.north !== bounds.south || bounds.east !== bounds.west)) map2d.current.fitBounds(bounds, 48);
      else { map2d.current.setCenter({ lat: latitude, lng: longitude }); map2d.current.setZoom(compact ? 20 : 18); }
    }
  }, [latitude, longitude, compact, currentFocus, locations, state]);

  return <section id="main-site-map" className={`site-map-card${compact ? " compact-map" : ""}`} aria-label="Site map">
    <div className="map-canvas">
      <div className="google-map-host" ref={host} />
      {state !== "ready3d" && state !== "ready2d" && <div className="map-fallback"><span>{state === "loading" ? "Preparing site map…" : state === "unavailable" ? "Google Maps key is not configured" : "Site map could not load"}</span><strong>{result.location.standardizedAddress ?? result.location.submittedAddress}</strong><small>{latitude?.toFixed(4)}, {longitude?.toFixed(4)}</small></div>}
    </div>
    {locations.length > 0 && <div className="map-focus-controls" aria-label="Map focus">
      <button type="button" aria-pressed={currentFocus === "site"} onClick={() => changeFocus("site")}>Site</button>
      <button type="button" aria-pressed={currentFocus === "chargers"} onClick={() => changeFocus("chargers")}>Chargers · {locations.length}</button>
    </div>}
    <div className="map-layer-label">{state === "ready2d" ? "Satellite" : "3D satellite"}</div>
  </section>;
}
