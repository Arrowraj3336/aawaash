import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { AVENUE_TYPES, applyAvenueBrochure, completeAvenueInventory } from "../../src/lib/27th-avenue-brochure";
import { getProjectFlats } from "../../src/lib/project-flats";

// Independently transcribed from the eight brochure sheets (pp. 5–8).
const expectedAreas: Record<string, number> = { A1:1314,A2:1251,A3:1251,A4:1314,A5:1251,A6:1125,A7:889,A8:1251,B1:1251,B2:1251,B3:1251,B4:1314,B5:1251,B6:1125,B7:889,B8:1251 };
describe("27th Avenue source-verified public catalogue", () => {
  it("keeps live copy, media, amenities and availability after the baseline is initialized", () => {
    const row = { slug: "27th", name: "Avenue West", description: "Updated copy", gallery: [], amenities: ["Clubhouse"], available_flats: 15, reserved_flats: 1, extra: { avenue_catalogue_initialized: true, avenue_inventory_v2: true, flats: [] } };
    expect(applyAvenueBrochure(row)).toMatchObject(row);
  });

  it("maps all brochure position codes exactly once to their listed super built-up areas", () => {
    const seen = AVENUE_TYPES.flatMap(t => t.codes);
    expect([...seen].sort()).toEqual(Object.keys(expectedAreas).sort());
    expect(new Set(seen).size).toBe(16);
    for (const t of AVENUE_TYPES) for (const code of t.codes) expect(t.area).toBe(expectedAreas[code]);
  });
  it("shows 64 provisional slots across eight floors without inventing availability or assigning plans", () => {
    const inventory = completeAvenueInventory({ project_id: "test-project", buildings: [], floors: [], flats: [] });
    expect(inventory.buildings[0]).toMatchObject({ total_floors: 8, total_flats: 64 });
    expect(inventory.floors.map(floor => floor.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(new Set(inventory.flats.map(flat => flat.unit_code)).size).toBe(64);
    for (const floor of inventory.floors) {
      expect(inventory.flats.filter(flat => flat.floor_id === floor.id)).toHaveLength(8);
    }
    for (const flat of inventory.flats) {
      expect(flat).toMatchObject({ bedrooms: 3, status: "not_released", area_sqft: null, floor_plan_url: null });
    }
    expect(applyAvenueBrochure({ slug: "27th", total_flats: 16, available_flats: 16 })).toMatchObject({
      total_floors: 8, total_flats: 64, available_flats: null, price_from: 6000000, price_min: 6000000,
    });
    const verified = { ...inventory.flats[0], id: "existing-flat", unit_code: "101", status: "sold" as const };
    const completed = completeAvenueInventory({ ...inventory, flats: [verified] });
    expect(completed.flats).toHaveLength(64);
    expect(completed.flats[0]).toBe(verified);
  });
  it("preserves an admin-added floor beyond the brochure even with no listed flats", () => {
    const baseline = completeAvenueInventory({ project_id: "test-project", buildings: [], floors: [], flats: [] });
    const ninth = { id: "live-floor", building_id: baseline.buildings[0].id, number: 9, name: "Ninth floor", total_flats: 0, floor_plan_url: null };
    const inventory = completeAvenueInventory({ ...baseline, floors: [...baseline.floors, ninth] });
    expect(inventory.floors).toHaveLength(9);
    expect(inventory.floors.at(-1)).toEqual(ninth);
    expect(inventory.flats).toHaveLength(64);
    expect(inventory.buildings[0].total_floors).toBe(9);
  });

  it("keeps every real plan type instead of adding generic 1/2 BHK fallbacks", () => {
    const row = applyAvenueBrochure({ slug:"27th", extra:{} }) as unknown as {extra: unknown};
    const cards = getProjectFlats(row.extra);
    expect(cards).toHaveLength(8);
    expect(cards.every(c => c.title.startsWith("3 BHK"))).toBe(true);
    expect(cards[6]?.note).toMatch(/Owner-confirmed as 3 BHK/);
    const other = {slug:"savitri-enclave",total_flats:20};
    expect(applyAvenueBrochure(other)).toBe(other);
  });
  it("retains a valid local 3D asset", () => {
    const model=readFileSync("public/projects/27th-avenue/27th-avenue-exterior.glb");
    expect(model.subarray(0,4).toString()).toBe("glTF");
    expect(model.readUInt32LE(4)).toBe(2);
    expect(model.readUInt32LE(8)).toBe(model.length);
  });
});
