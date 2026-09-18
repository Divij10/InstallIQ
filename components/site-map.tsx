"use client";

import { useEffect, useRef, useState } from "react";
import type { AssessmentResult } from "@/lib/domain/assessment";

let maps3dLoader: Promise<void> | undefined;

type GoogleMapsRuntime = {
  maps?: {
    Map?: new (element: HTMLElement, options: Record<string, unknown>) => unknown;
    Marker?: new (options: Record<string, unknown>) => unknown;
  };
};

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

export function SiteMap({ result }: { result: AssessmentResult }) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready3d" | "ready2d" | "unavailable" | "error">("loading");
  const latitude = result.location.latitude;
  const longitude = result.location.longitude;
  const route = result.serviceArea;

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) { setState("unavailable"); return; }
    const canvas = document.createElement("canvas");
    const supports3d = Boolean(canvas.getContext("webgl2"));
    let cancelled = false;
    async function renderMap() {
      try {
        const response = await fetch("/api/maps/config", { cache: "no-store" });
        const config = await response.json() as { enabled?: boolean; apiKey?: string };
        if (!config.enabled || !config.apiKey) { if (!cancelled) setState("unavailable"); return; }
        await loadGoogleMaps3d(config.apiKey);
        if (cancelled || !host.current) return;
        if (!supports3d) {
          const runtime = (window as typeof window & { google?: GoogleMapsRuntime }).google;
          if (!runtime?.maps?.Map) throw new Error("Google Maps 2D renderer is unavailable.");
          const center = { lat: latitude, lng: longitude };
          const twoDimensionalMap = new runtime.maps.Map(host.current, {
            center,
            zoom: 18,
            mapTypeId: "satellite",
            disableDefaultUI: true,
            gestureHandling: "cooperative",
            backgroundColor: "#0c2135",
          });
          if (runtime.maps.Marker) new runtime.maps.Marker({ map: twoDimensionalMap, position: center });
          if (!cancelled) setState("ready2d");
          return;
        }
        const map = document.createElement("gmp-map-3d");
        map.setAttribute("center", `${latitude},${longitude},500`);
        map.setAttribute("range", "1300");
        map.setAttribute("tilt", "62");
        map.setAttribute("heading", "18");
        map.setAttribute("mode", "HYBRID");
        map.setAttribute("default-ui-hidden", "true");
        host.current.replaceChildren(map);
        if (!cancelled) setState("ready3d");
      } catch { if (!cancelled) setState("error"); }
    }
    void renderMap();
    return () => { cancelled = true; };
  }, [latitude, longitude]);

  const routeSummary = route?.routeAvailable
    ? `${route.routeDistanceMiles?.toFixed(1)} route mi · ${route.travelMinutes ? `${Math.round(route.travelMinutes)} min drive` : "travel time returned"}`
    : `${route?.straightLineMiles?.toFixed(1) ?? "—"} straight-line mi`;
  return <section className="site-map-card" aria-label="3D site map">
    <div className="map-canvas">
      <div className="google-map-host" ref={host} />
      {state !== "ready3d" && state !== "ready2d" && <div className="map-fallback"><span>{state === "loading" ? "Preparing site map…" : state === "unavailable" ? "Google Maps key is not configured" : "Site map could not load"}</span><strong>{result.location.standardizedAddress ?? result.location.submittedAddress}</strong><small>{latitude?.toFixed(4)}, {longitude?.toFixed(4)}</small></div>}
    </div>
    <div className="map-identity"><span>VERIFIED SITE</span><strong>{result.location.preciselyId ?? "Precisely ID unavailable"}</strong><small>Match {result.location.matchMetadata ?? "—"} · {routeSummary}</small></div>
    <div className="map-layer-label">{state === "ready2d" ? "Satellite site view" : "3D satellite site view"}</div>
  </section>;
}
