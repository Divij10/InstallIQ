import { describe, expect, it } from "vitest";
import { groupChargingLocations } from "@/lib/domain/charging-locations";

describe("public charging map locations", () => {
  it("groups station records sharing coordinates and ignores missing or invalid coordinates", () => {
    const locations = groupChargingLocations([
      { id: 1, name: "A", latitude: 33.414512, longitude: -111.895086 },
      { id: 2, name: "B", latitude: 33.414512, longitude: -111.895086 },
      { id: 3, name: "C", latitude: 33.415, longitude: -111.896 },
      { id: 4, name: "No coordinates" },
      { id: 5, name: "Invalid coordinates", latitude: 123, longitude: -111.896 },
    ]);

    expect(locations).toHaveLength(2);
    expect(locations[0].stations.map((station) => station.id)).toEqual([1, 2]);
    expect(locations[1].stations.map((station) => station.id)).toEqual([3]);
  });
});
