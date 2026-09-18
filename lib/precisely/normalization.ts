type JsonRecord = Record<string, unknown>;

const asRecord = (value: unknown): JsonRecord | undefined => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : undefined;

function visit(value: unknown, fn: (record: JsonRecord) => unknown): unknown {
  if (Array.isArray(value)) {
    for (const item of value) { const found = visit(item, fn); if (found !== undefined) return found; }
    return undefined;
  }
  const record = asRecord(value);
  if (!record) return undefined;
  if (typeof record.text === "string") {
    try { const found = visit(JSON.parse(record.text), fn); if (found !== undefined) return found; } catch { /* plain text */ }
  }
  const own = fn(record);
  if (own !== undefined) return own;
  for (const child of Object.values(record)) { const found = visit(child, fn); if (found !== undefined) return found; }
  return undefined;
}

export function pickString(data: unknown, keys: string[]): string | undefined {
  return visit(data, (record) => {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" || typeof value === "number") return String(value);
    }
    return undefined;
  }) as string | undefined;
}

export function pickCoordinates(data: unknown): { latitude: number; longitude: number } | undefined {
  return visit(data, (record) => {
    const latitude = Number(record.latitude ?? record.lat);
    const longitude = Number(record.longitude ?? record.lng ?? record.lon);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) return { latitude, longitude };
    const coordinates = record.coordinates;
    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      const [longitudeValue, latitudeValue] = coordinates;
      if (typeof longitudeValue === "number" && typeof latitudeValue === "number") return { latitude: latitudeValue, longitude: longitudeValue };
    }
    return undefined;
  }) as { latitude: number; longitude: number } | undefined;
}
