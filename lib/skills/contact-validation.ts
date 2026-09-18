import type { AssessmentRequest, ContactResult } from "@/lib/domain/assessment";
import { evidence } from "@/lib/domain/evidence";
import { trace } from "@/lib/domain/trace";
import { asPreciselyEvidence } from "@/lib/precisely/evidence";
import type { PreciselyClient, PreciselyInvocationResult } from "@/lib/precisely/types";
import type { SkillResult } from "./types";

function notRequested(capability: string, message: string) {
  return evidence({
    status: "not_requested",
    source: { provider: "Precisely", transport: "mcp", capability },
    message,
    rawAvailable: false
  });
}

export async function contactValidationSkill(client: PreciselyClient, request: AssessmentRequest): Promise<SkillResult<ContactResult>> {
  const events = [trace({ phase: "contact", type: "skill_started", skillName: "Contact Validation", message: "Checking optional customer contact…" })];
  const skipped = (message: string): PreciselyInvocationResult => ({ status: "unavailable", message });
  const [name, email, phone] = await Promise.all([
    request.contactName ? client.invoke("CONTACT_NAME_PARSE", { name: request.contactName }) : Promise.resolve(skipped("Contact name was not supplied.")),
    request.email ? client.invoke("CONTACT_EMAIL_VERIFY", { email: request.email }) : Promise.resolve(skipped("Email was not supplied.")),
    request.phone ? client.invoke("CONTACT_PHONE_VALIDATE", { phone: request.phone }) : Promise.resolve(skipped("Phone was not supplied."))
  ]);
  const warnings: string[] = [];
  if (email.status === "error") warnings.push("Email validation was unavailable; continue with contact confirmation.");
  if (phone.status === "error") warnings.push("Phone validation was unavailable; continue with contact confirmation.");

  const optionalEvidence = [
    request.contactName ? asPreciselyEvidence("CONTACT_NAME_PARSE", name) : notRequested("CONTACT_NAME_PARSE", "Contact name was not supplied, so no Precisely name action was called."),
    request.email ? asPreciselyEvidence("CONTACT_EMAIL_VERIFY", email) : notRequested("CONTACT_EMAIL_VERIFY", "Email was not supplied, so no Precisely email action was called."),
    request.phone ? asPreciselyEvidence("CONTACT_PHONE_VALIDATE", phone) : notRequested("CONTACT_PHONE_VALIDATE", "Phone was not supplied, so no Precisely phone action was called.")
  ];
  const data = {
    name: request.contactName ?? "",
    nameStatus: request.contactName ? (name.status === "success" ? "Parsed" : "Not verified") : "Not supplied",
    emailStatus: request.email ? (email.status === "success" ? "Format appears usable" : "Unverified") : "Not supplied",
    phoneStatus: request.phone ? (phone.status === "success" ? "Format appears usable" : "Unverified") : "Not supplied",
    warnings
  };
  events.push(trace({ phase: "contact", type: "skill_completed", skillName: "Contact Validation", message: "Optional contact check completed", status: "success" }));
  return { data, evidence: optionalEvidence, warnings, trace: events };
}
