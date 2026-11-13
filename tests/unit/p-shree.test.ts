import { describe, expect, it } from "vitest";
import { applyPShreeDocuments, getPShreeBrochureInventory, getPShreeContent, P_SHREE_PROJECT } from "../../src/lib/p-shree";

describe("P Shree catalogue", () => {
  it("lists each confirmed flat once under its tower, with booking status pending confirmation", () => {
    const inventory = getPShreeBrochureInventory("project");
    expect(P_SHREE_PROJECT.price_min).toBe(4_500_000);
    expect(P_SHREE_PROJECT.total_flats).toBe(28);
    expect(inventory.buildings.map(tower => [tower.code, tower.total_flats])).toEqual([["A", 10], ["B", 10], ["C", 8]]);
    expect(inventory.flats.map(flat => flat.unit_code)).toEqual([
      ...Array.from({ length: 10 }, (_, i) => `A${101 + i}`),
      ...Array.from({ length: 10 }, (_, i) => `B${101 + i}`),
      ...Array.from({ length: 8 }, (_, i) => `C${101 + i}`),
    ]);
    expect(inventory.flats.every(flat => flat.status === "not_released" && flat.price === null)).toBe(true);
  });

  it("corrects the old catalogue figures and honours subsequent Admin edits", () => {
    const legacy = { slug: "p-shree", total_flats: 140, total_units: 140, price_from: 0, price_min: null, extra: {} };
    expect(applyPShreeDocuments(legacy)).toMatchObject({ total_flats: 28, total_units: 28, price_from: 4_500_000, price_min: 4_500_000 });
    expect(applyPShreeDocuments({ ...legacy, total_flats: 29, price_min: 4_600_000, extra: { p_shree_inventory_initialized: true } }))
      .toMatchObject({ total_flats: 29, price_min: 4_600_000 });
    expect(getPShreeContent({ p_shree: { highlights: ["Updated point"], renderings: null } }))
      .toMatchObject({ highlights: ["Updated point"], renderings: null });
  });
});
