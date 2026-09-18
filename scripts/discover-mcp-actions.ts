import { createPreciselyClient } from "../lib/precisely/client";

const goals = [
  "autocomplete a street address while a user types",
  "verify standardize and correct a postal address",
  "geocode a street address to latitude and longitude",
  "retrieve property attributes or assessor data for an address",
  "retrieve building information for an address",
  "retrieve parcel information or parcel boundaries for an address",
  "look up tax jurisdiction from coordinates",
  "find authority having jurisdiction emergency services or local agency from coordinates",
  "look up timezone from coordinates",
  "retrieve nearby places or points of interest from coordinates",
  "calculate route distance or travel time between locations",
  "retrieve satellite imagery aerial imagery or site photos for an address",
  "create a 3D building model terrain model or site visualization"
];

async function main() {
  const client = createPreciselyClient();
  const health = await client.health();
  if (!health.connected || !health.tools?.some((tool) => tool.name === "precisely_actions_search")) throw new Error("The hosted Precisely action gateway is not connected.");

  console.log("Precisely action discovery (read-only)");
  for (const goal of goals) {
    const actions = await client.searchActions(goal, 8);
    console.log(`\n${goal}`);
    if (!actions.length) console.log("  No matching action returned.");
    for (const action of actions) console.log(`  ${action.actionId} — ${action.title ?? action.description ?? "No title returned"}`);
  }
  await client.close();
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Catalog discovery failed."); process.exitCode = 1; });
