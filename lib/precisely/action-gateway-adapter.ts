import type { PreciselyCapability, PreciselyInvocationResult } from "./types";
import { DirectToolAdapter } from "./direct-tool-adapter";

type JsonRecord = Record<string, unknown>;
type ActionDetails = { actionId: string; inputsSchema?: JsonRecord; examples?: unknown[] };

const asRecord = (value: unknown): JsonRecord | undefined => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : undefined;

const approvedActions: Partial<Record<PreciselyCapability, string>> = {
  CONTACT_NAME_PARSE: "verification.parse_name",
  CONTACT_EMAIL_VERIFY: "verification.emails",
  CONTACT_PHONE_VALIDATE: "verification.phones",
  ADDRESS_AUTOCOMPLETE: "geo_addressing.autocomplete",
  ADDRESS_VERIFY: "geo_addressing.verify_address",
  ADDRESS_GEOCODE: "geo_addressing.geocode",
  PROPERTY_ATTRIBUTES: "property.structure",
  BUILDING_INFORMATION: "property.buildings",
  PARCEL_INFORMATION: "property.parcels",
  ROOF_ATTRIBUTES: "property.roof_attributes",
  TAX_JURISDICTION: "tax.jurisdiction",
  AUTHORITY_HAVING_JURISDICTION: "emergency.services",
  TIMEZONE: "timezone.lookup",
  PLACES_CONTEXT: "address_proximity.search",
  ROUTE_OR_TRAVEL_TIME: "routing.directions"
};

/** Hosted DIS gateway adapter. Every request is search -> describe -> validate -> execute. */
export class ActionGatewayAdapter extends DirectToolAdapter {
  private mappings = new Map<PreciselyCapability, string>();
  private details = new Map<string, ActionDetails>();

  constructor(url: string, requestInit?: RequestInit) { super(url, "hosted", requestInit); }

  async invoke(capability: PreciselyCapability, input: unknown): Promise<PreciselyInvocationResult> {
    const direct = await super.invoke(capability, input);
    if (direct.status !== "unavailable") return direct;
    if (!approvedActions[capability]) return { status: "unavailable", message: `${capability} is not enabled until InstallIQ has an approved action contract for it.` };

    const search = this.tools.find((tool) => tool.name === "precisely_actions_search");
    const describe = this.tools.find((tool) => tool.name === "precisely_actions_describe");
    const execute = this.tools.find((tool) => tool.name === "precisely_actions_execute");
    if (!search || !describe || !execute || !this.client) return { status: "unavailable", message: `Hosted gateway has no dynamically resolved action for ${capability}.` };

    try {
      const actionId = await this.findActionId(capability, search);
      if (!actionId) return { status: "unavailable", message: `Hosted search returned no approved action for ${capability}.` };
      const details = await this.describeAction(actionId, describe);
      const argumentsForAction = this.buildArguments(this.transformInput(capability, input), details);
      if (typeof argumentsForAction === "string") return { status: "error", message: `${actionId}: ${argumentsForAction}` };

      const result = await this.client.callTool({ name: execute.name, arguments: { action_id: actionId, arguments: argumentsForAction } });
      const data = result.structuredContent ?? result.content;
      const actionError = this.findActionError(data);
      return result.isError || actionError
        ? { status: "error", message: actionError ?? JSON.stringify(data), raw: data, toolName: execute.name, actionName: actionId }
        : { status: "success", data, raw: data, toolName: execute.name, actionName: actionId };
    } catch (error) {
      return { status: "error", message: error instanceof Error ? error.message : "Hosted action execution failed." };
    }
  }

  private async findActionId(capability: PreciselyCapability, search: { name: string }): Promise<string | undefined> {
    const cached = this.mappings.get(capability);
    if (cached) return cached;
    const found = await this.client!.callTool({ name: search.name, arguments: { goal: this.goalFor(capability), max_results: 8 } });
    const approvedAction = approvedActions[capability];
    // A semantic search may rank a related action ahead of the approved contract.
    // Select the exact approved action anywhere in the returned candidate list.
    const candidate = approvedAction && this.findRecord(found.structuredContent ?? found.content, (record) => record.action_id === approvedAction);
    if (!approvedAction || !candidate) return undefined;
    this.mappings.set(capability, approvedAction);
    return approvedAction;
  }

  private async describeAction(actionId: string, describe: { name: string }): Promise<ActionDetails> {
    const cached = this.details.get(actionId);
    if (cached) return cached;
    const result = await this.client!.callTool({ name: describe.name, arguments: { action_id: actionId } });
    const description = this.findRecord(result.structuredContent ?? result.content, (record) => record.action_id === actionId && Boolean(record.inputs_schema));
    if (!description) throw new Error(`Hosted gateway did not return an input schema for ${actionId}.`);
    const details = { actionId, inputsSchema: asRecord(description.inputs_schema), examples: Array.isArray(description.examples) ? description.examples : [] };
    this.details.set(actionId, details);
    return details;
  }

  private transformInput(capability: PreciselyCapability, input: unknown): JsonRecord {
    const source = asRecord(input) ?? {};
    const address = typeof source.address === "string" ? source.address : undefined;
    const latitude = typeof source.latitude === "number" ? source.latitude : undefined;
    const longitude = typeof source.longitude === "number" ? source.longitude : undefined;
    switch (capability) {
      case "CONTACT_NAME_PARSE": return { data: { name: source.name } };
      case "CONTACT_EMAIL_VERIFY": return { emails: [{ id: "installiq", email: source.email }] };
      case "CONTACT_PHONE_VALIDATE": return { phones: [{ id: "installiq", phoneNumber: source.phone, country: "US" }] };
      case "ADDRESS_AUTOCOMPLETE": return { address: { addressLines: [source.query], country: "USA" }, express: true, preferences: { maxResults: 5 } };
      case "TAX_JURISDICTION": return latitude !== undefined && longitude !== undefined ? { input_type: "location", records: [{ longitude, latitude }] } : { input_type: "address", records: [{ addressLines: [address] }] };
      case "AUTHORITY_HAVING_JURISDICTION": return latitude !== undefined && longitude !== undefined ? { location: { coordinates: [longitude, latitude] }, include_ahj: true } : { address: { addressLines: [address] }, include_ahj: true };
      case "TIMEZONE": return latitude !== undefined && longitude !== undefined ? { locations: [{ id: "installiq", timestamp: Date.now(), geometry: { coordinates: [longitude, latitude] } }] } : {};
      case "PLACES_CONTEXT": return latitude !== undefined && longitude !== undefined ? { preferences: { dataset: "physical-places", maxResults: 5, distance: { value: 0.5, distanceUnit: "MILE" }, autoRoute: true }, location: { addressId: "installiq", country: "USA", latitude, longitude } } : {};
      case "ROUTE_OR_TRAVEL_TIME": {
        const r: JsonRecord = { option: "flexible", origin: source.origin, destination: source.destination };
        if (typeof source.mode === "string") r.mode = source.mode;
        return r;
      }
      case "PROPERTY_ATTRIBUTES": return source.preciselyId ? { id: source.preciselyId, query_type: "PRECISELY_ID", fields: ["footprintAreaSquareFootage", "landUseDescription", "yearBuilt", "numberOfBuildingsInParcel", "numberOfStories", "squareFootage"] } : { address, country: "US" };
      case "BUILDING_INFORMATION": return source.preciselyId ? { id: source.preciselyId, query_type: "PRECISELY_ID", fields: ["buildingArea", "buildingID", "buildingType", "elevation", "ubid"] } : { address, country: "US" };
      case "PARCEL_INFORMATION": return source.preciselyId ? { id: source.preciselyId, query_type: "PRECISELY_ID", fields: ["apn", "parcelArea", "parcelID", "elevation"] } : { address, country: "US" };
      case "ROOF_ATTRIBUTES": return source.preciselyId ? { id: source.preciselyId, query_type: "PRECISELY_ID", fields: ["roofType", "roofCondition", "solarPanelAreaSquareFootage", "airConditionerCount", "imageDate"] } : { address, country: "US" };
      default: return source;
    }
  }

  /** Validates InstallIQ's capability-specific input against the action schema before execution. */
  private buildArguments(input: JsonRecord, details: ActionDetails): JsonRecord | string {
    const schema = details.inputsSchema;
    const properties = asRecord(schema?.properties);
    if (!properties) return "The described action has no usable input schema.";
    const unsupported = Object.keys(input).filter((key) => !properties[key]);
    if (unsupported.length) return `Unsupported input field(s): ${unsupported.join(", ")}.`;
    const required = Array.isArray(schema?.required) ? schema.required.filter((value): value is string => typeof value === "string") : [];
    const missing = required.filter((key) => input[key] === undefined || input[key] === "");
    if (missing.length) return `Missing required input field(s): ${missing.join(", ")}.`;
    return input;
  }

  private goalFor(capability: PreciselyCapability): string {
    const goals: Record<PreciselyCapability, string> = {
      CONTACT_NAME_PARSE: "parse a person's name", CONTACT_EMAIL_VERIFY: "validate an email address", CONTACT_PHONE_VALIDATE: "validate a phone number", ADDRESS_AUTOCOMPLETE: "autocomplete a street address while a user types", ADDRESS_VERIFY: "validate and standardize a street address", ADDRESS_GEOCODE: "geocode a street address to latitude longitude and PreciselyID", PROPERTY_ATTRIBUTES: "retrieve property structure for an address", BUILDING_INFORMATION: "retrieve building information for an address", PARCEL_INFORMATION: "retrieve parcel information for an address", ROOF_ATTRIBUTES: "retrieve roof attributes for an address", TAX_JURISDICTION: "look up tax jurisdiction for a street address", AUTHORITY_HAVING_JURISDICTION: "find emergency services or AHJ context for a street address", TIMEZONE: "look up timezone from coordinates", PLACES_CONTEXT: "find physical places near a commercial site using latitude and longitude", ROUTE_OR_TRAVEL_TIME: "get traffic-aware driving directions between locations"
    };
    return goals[capability];
  }

  private findString(value: unknown, keys: string[]): string | undefined {
    const record = this.findRecord(value, (candidate) => keys.some((key) => typeof candidate[key] === "string"));
    return record ? keys.map((key) => record[key]).find((candidate): candidate is string => typeof candidate === "string") : undefined;
  }

  /** The hosted gateway can return a successful MCP envelope around an action-level error. */
  private findActionError(value: unknown): string | undefined {
    const error = this.findRecord(value, (record) => record.status === "error" && Boolean(record.error));
    if (!error) return undefined;
    const details = asRecord(error.error);
    return typeof details?.message === "string" ? details.message : JSON.stringify(details ?? error);
  }

  private findRecord(value: unknown, matches: (record: JsonRecord) => boolean): JsonRecord | undefined {
    if (Array.isArray(value)) { for (const item of value) { const found = this.findRecord(item, matches); if (found) return found; } return undefined; }
    const record = asRecord(value);
    if (!record) return undefined;
    if (typeof record.text === "string") { try { const found = this.findRecord(JSON.parse(record.text), matches); if (found) return found; } catch { /* plain text */ } }
    if (matches(record)) return record;
    for (const child of Object.values(record)) { const found = this.findRecord(child, matches); if (found) return found; }
    return undefined;
  }
}
