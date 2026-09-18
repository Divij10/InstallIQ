import { NextResponse } from "next/server";
import { env } from "@/lib/config/env";

/** A Maps JavaScript key is a browser key and must be restricted by HTTP referrer in Google Cloud. */
export async function GET() {
  return NextResponse.json(
    { enabled: Boolean(env.GOOGLE_MAPS_API_KEY), apiKey: env.GOOGLE_MAPS_API_KEY || undefined },
    { headers: { "Cache-Control": "no-store" } }
  );
}
