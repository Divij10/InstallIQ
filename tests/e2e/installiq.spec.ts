import { expect, test } from "@playwright/test";
import type { AssessmentResult } from "@/lib/domain/assessment";

const assessment: AssessmentResult = {
  status: "FIELD_SURVEY_REQUIRED",
  explanation: "The site identity was resolved and useful digital context was collected. Physical engineering and site facts still require a field survey.",
  nextAction: "Schedule field survey",
  businessName: "Test Business",
  chargerType: "LEVEL_2",
  chargerCount: 2,
  mode: "local",
  location: {
    submittedAddress: "1317 S Terrace Rd, Tempe, AZ 85281",
    standardizedAddress: "1317 S TERRACE RD, TEMPE AZ 85281-5814, UNITED STATES OF AMERICA",
    latitude: 33.41323,
    longitude: -111.92595,
    matchMetadata: "Verified",
    preciselyId: "test-precisely-id",
    resolved: true
  },
  property: {
    propertyType: "Commercial",
    buildingArea: "12000",
    buildingCount: "1",
    roofType: "Flat",
    roofCondition: "Not reported"
  },
  jurisdiction: {
    taxJurisdiction: "Tempe",
    ahj: "Tempe Fire Medical Rescue Department",
    disclaimer: "Location context is not a permit determination."
  },
  siteContext: {
    timeZone: "America/Phoenix"
  },
  serviceArea: {
    enabled: true,
    inside: true,
    distanceMiles: 9.2,
    straightLineMiles: 8.1,
    thresholdMiles: 35,
    routeDistanceMiles: 9.2,
    travelMinutes: 17,
    routeAvailable: true
  },
  brief: {
    headline: "Digital site check complete",
    summary: "1317 S TERRACE RD, TEMPE AZ 85281-5814, UNITED STATES OF AMERICA was resolved through Precisely.",
    siteSignals: ["Precisely site ID: P00001WPS43H."],
    dataLimitations: ["Electrical capacity requires a field survey."],
    nextSteps: ["Schedule field survey"],
    explanations: {
      serviceArea: "The route result is used for operating-area context only.",
      evInfrastructure: "Public EV stations are nearby context only.",
      evidenceCoverage: "This measures returned digital evidence, not site quality.",
      fieldSurvey: "Electrical capacity requires a field survey."
    },
    source: "rules"
  },
  evidenceScore: {
    score: 85,
    maxScore: 100,
    band: "Strong",
    disclaimer: "This measures returned digital evidence only.",
    factors: [
      { id: "site_identity", label: "Site identity", earned: 30, weight: 30, summary: "Complete", evidenceSources: ["ADDRESS_VERIFY"] },
      { id: "service_area", label: "Service-area context", earned: 20, weight: 20, summary: "Complete", evidenceSources: ["ROUTE_OR_TRAVEL_TIME"] },
      { id: "property_context", label: "Property context", earned: 15, weight: 20, summary: "Partial", evidenceSources: ["PROPERTY_ATTRIBUTES"] },
      { id: "jurisdiction_context", label: "Jurisdiction context", earned: 15, weight: 15, summary: "Complete", evidenceSources: ["TAX_JURISDICTION"] },
      { id: "public_ev_context", label: "Public EV context", earned: 5, weight: 15, summary: "Partial", evidenceSources: ["EV_STATION_INVENTORY"] }
    ]
  },
  gaps: ["Electrical service capacity", "Panel location", "Trenching path"],
  warnings: [],
  trace: [
    {
      id: "trace-1",
      timestamp: "2026-09-18T00:00:00.000Z",
      phase: "assessment",
      type: "completed",
      message: "Assessment complete"
    }
  ],
  evidence: [
    {
      id: "ev-1",
      retrievedAt: "2026-09-18T00:00:00.000Z",
      status: "success",
      source: { provider: "Precisely", transport: "mcp", capability: "ADDRESS_VERIFY", toolName: "verify_address" },
      rawAvailable: true
    },
    {
      id: "ev-2",
      retrievedAt: "2026-09-18T00:00:00.000Z",
      status: "unavailable",
      source: { provider: "Precisely", transport: "mcp", capability: "PARCEL_INFORMATION" },
      rawAvailable: false
    }
  ]
};

test("assessment results keep labels and values visually separated", async ({ page }) => {
  await page.route("**/api/health", async (route) => {
    await route.fulfill({ json: { mode: "local" } });
  });
  await page.route("**/api/address-suggestions**", async (route) => {
    await route.fulfill({ json: { suggestions: [] } });
  });
  await page.route("**/api/assessment", async (route) => {
    await route.fulfill({ json: assessment });
  });

  await page.goto("/");
  await page.getByLabel("Site or business name").fill("InstallIQ Test Site");
  await page.getByLabel("Installation address").fill("1317 S Terrace Rd, Tempe, AZ 85281");
  await page.getByRole("button", { name: "CHECK THIS SITE" }).click();

  await expect(page.getByLabel("Assessment decision")).toContainText("FIELD SURVEY REQUIRED");
  await expect(page.getByRole("heading", { name: "Schedule field survey" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Site findings" })).toBeVisible();
  await page.getByRole("tab", { name: "Site record" }).click();
  const identitySection = page.getByRole("button", { name: /Site identity/ });
  await expect(identitySection).toHaveAttribute("aria-expanded", "false");
  await identitySection.click();
  await expect(identitySection).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByLabel("Site record").getByText("Precisely ID")).toBeVisible();
  await page.getByRole("tab", { name: "Source activity" }).click();
  await expect(page.getByLabel("Source activity")).toContainText("ADDRESS_VERIFY");
});
