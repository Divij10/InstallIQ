import { NextRequest, NextResponse } from "next/server";
import { createPreciselyClient } from "@/lib/precisely/client";

type JsonRecord = Record<string, unknown>;
const asRecord = (value: unknown): JsonRecord | undefined => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : undefined;

function collectLabels(value: unknown, labels = new Set<string>()): string[] {
  if (Array.isArray(value)) value.forEach((item) => collectLabels(item, labels));
  const record = asRecord(value);
  if (!record) return [...labels];
  if (typeof record.text === "string") { try { collectLabels(JSON.parse(record.text), labels); } catch { /* plain text */ } }
  for (const key of ["predictedAddress", "formattedAddress", "displayAddress", "address"]) {
    if (typeof record[key] === "string" && record[key].length > 5) labels.add(record[key]);
  }
  if (Array.isArray(record.addressLines) && record.addressLines.every((line) => typeof line === "string")) labels.add(record.addressLines.join(", "));
  Object.values(record).forEach((child) => collectLabels(child, labels));
  return [...labels].slice(0, 5);
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 3) return NextResponse.json({ suggestions: [] });
  const client = createPreciselyClient();
  try {
    await client.connect();
    const result = await client.invoke("ADDRESS_AUTOCOMPLETE", { query });
    if (result.status !== "success") return NextResponse.json({ suggestions: [] });
    return NextResponse.json({ suggestions: collectLabels(result.data).map((label) => ({ label })) });
  } catch {
    return NextResponse.json({ suggestions: [] });
  } finally {
    await client.close().catch(() => undefined);
  }
}
