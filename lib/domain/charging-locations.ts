import type { EvStation } from "./assessment";

export type ChargingLocation = {
  key: string;
  latitude: number;
  longitude: number;
  stations: EvStation[];
};

/** AFDC can return several station records at one address; display one pin per coordinate. */
export function groupChargingLocations(stations: EvStation[]): ChargingLocation[] {
  const locations = new Map<string, ChargingLocation>();
  for (const station of stations) {
    const { latitude, longitude } = station;
    if (latitude === undefined || longitude === undefined || !Number.isFinite(latitude) || !Number.isFinite(longitude)
      || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) continue;
    const key = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    const location = locations.get(key);
    if (location) location.stations.push(station);
    else locations.set(key, { key, latitude, longitude, stations: [station] });
  }
  return [...locations.values()];
}
