import type {
  AssessmentRequest,
  LocationResult,
} from "@/lib/domain/assessment";
import { trace } from "@/lib/domain/trace";
import { asPreciselyEvidence } from "@/lib/precisely/evidence";
import type { PreciselyClient } from "@/lib/precisely/types";
import { pickCoordinates, pickString } from "@/lib/precisely/normalization";
import type { SkillResult } from "./types";
export async function addressResolutionSkill(
  client: PreciselyClient,
  request: AssessmentRequest,
): Promise<SkillResult<LocationResult>> {
  const events = [
    trace({
      phase: "location",
      type: "skill_started",
      skillName: "Address Resolution",
      message: "Address Resolution Skill started",
    }),
    trace({
      phase: "location",
      type: "tool_called",
      skillName: "Address Resolution",
      message: "Precisely MCP → address verification",
    }),
  ];
  const verified = await client.invoke("ADDRESS_VERIFY", {
    address: request.rawAddress,
  });
  const ev = [asPreciselyEvidence("ADDRESS_VERIFY", verified)];
  if (verified.status !== "success") {
    events.push(
      trace({
        phase: "location",
        type: "stopped",
        skillName: "Address Resolution",
        message:
          "Address could not be reliably resolved; site enrichment stopped.",
        status: "not_found",
      }),
    );
    return {
      data: { submittedAddress: request.rawAddress, resolved: false },
      evidence: ev,
      warnings: [verified.message ?? "Address could not be resolved."],
      trace: events,
    };
  }
  events.push(
    trace({
      phase: "location",
      type: "tool_completed",
      skillName: "Address Resolution",
      message: "Address standardized",
      status: "success",
    }),
    trace({
      phase: "location",
      type: "tool_called",
      skillName: "Address Resolution",
      message: "Precisely MCP → geocode",
    }),
  );
  const geocode = await client.invoke("ADDRESS_GEOCODE", {
    address: request.rawAddress,
  });
  ev.push(asPreciselyEvidence("ADDRESS_GEOCODE", geocode));
  const source = geocode.status === "success" ? geocode.data : verified.data;
  const coordinates = pickCoordinates(source);
  const resolved = Boolean(coordinates);
  const data = {
    submittedAddress: request.rawAddress,
    standardizedAddress: pickString(verified.data, [
      "standardizedAddress",
      "formattedAddress",
      "address",
    ]),
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
    matchMetadata:
      pickString(verified.data, [
        "matchMetadata",
        "matchCode",
        "confidence",
        "score",
      ]) ?? "Source did not provide a normalized confidence value.",
    preciselyId: pickString(source, ["preciselyId", "pbKey", "PB_KEY", "id"]),
    parcelReference: pickString(verified.data, ["APN_ID", "apnId", "apn"]),
    elevation: pickString(verified.data, ["PARCEN_ELEVATION", "elevation"]),
    resolved,
  };
  events.push(
    trace({
      phase: "location",
      type: resolved ? "skill_completed" : "stopped",
      skillName: "Address Resolution",
      message: resolved
        ? "Site resolved"
        : "Geocoding did not establish trustworthy coordinates; site enrichment stopped.",
      status: resolved ? "success" : "not_found",
    }),
  );
  return {
    data,
    evidence: ev,
    warnings: resolved
      ? []
      : [
          geocode.message ??
            "Address geocoding did not establish a site identity.",
        ],
    trace: events,
  };
}
