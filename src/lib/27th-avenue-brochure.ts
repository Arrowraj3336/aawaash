import type { ProjectInventory } from "./inventory.functions";

/**
 * Source: owner-supplied `27 avn.pdf`, pp. 4–12.
 * Owner-confirmed totals: eight residential floors with eight flats each.
 * The brochure identifies A1–B8 and their plans. Floor assignments are unconfirmed.
 */
export const AVENUE_ASSET = "/projects/27th-avenue";
export const AVENUE_TYPE7_NOTE = "Owner-confirmed as 3 BHK. The original Type 7 brochure drawing and bedroom bullet show two bedrooms; confirm the final layout with the developer. The source plan is reproduced unchanged.";
export const AVENUE_TYPES = [
  { type: 1, codes: ["B8"], area: 1251, balconies: 3, image: "type-1-b8.webp", page: 5 },
  { type: 2, codes: ["B5"], area: 1251, balconies: 3, image: "type-2-b5.webp", page: 5 },
  { type: 3, codes: ["A1", "A4", "B4"], area: 1314, balconies: 2, image: "type-3-a1-a4-b4.webp", page: 6 },
  { type: 4, codes: ["A2", "A3", "B2", "B3"], area: 1251, balconies: 1, image: "type-4-a2-a3-b2-b3.webp", page: 6 },
  { type: 5, codes: ["A5", "A8"], area: 1251, balconies: 2, image: "type-5-a5-a8.webp", page: 7 },
  { type: 6, codes: ["A6", "B6"], area: 1125, balconies: 1, image: "type-6-a6-b6.webp", page: 7 },
  { type: 7, codes: ["A7", "B7"], area: 889, balconies: 1, image: "type-7-a7-b7.webp", page: 8 },
  { type: 8, codes: ["B1"], area: 1251, balconies: 3, image: "type-8-b1.webp", page: 8 },
] as const;
export const AVENUE_AMENITIES = ["Temple", "Kids Pool", "Lawn", "Kids Play Area", "Jogging Track", "Green Area", "Gym", "CCTV", "Earthquake-resistant structure", "Fire Safety", "24×7 Water Supply", "24×7 Power Backup"];
export const AVENUE_FLOORS = 8;
export const AVENUE_FLATS_PER_FLOOR = 8;
export const AVENUE_TOTAL_FLATS = AVENUE_FLOORS * AVENUE_FLATS_PER_FLOOR;
export const AVENUE_STARTING_PRICE = 6000000;
export const AVENUE_PRICE_LABEL = "₹60 lakh+";

export function applyAvenueBrochure<T extends { slug?: string | null }>(row: T): T {
  if (row.slug !== "27th") return row;
  const old = row as Record<string, unknown>;
  const extra = (old.extra && typeof old.extra === "object" ? old.extra : {}) as Record<string, unknown>;
  const initialized = extra.avenue_catalogue_initialized === true;
  const cover = `${AVENUE_ASSET}/exterior-front.webp`;
  const defaultGallery = ["exterior-front.webp", "exterior-perspective.webp", "exterior-aerial.webp", "typical-floor-plan.webp"].map(name => `${AVENUE_ASSET}/${name}`);
  const gallery = Array.isArray(old.gallery) && (initialized || old.gallery.length) ? old.gallery : defaultGallery;
  const amenities = Array.isArray(old.amenities) && (initialized || old.amenities.length) ? old.amenities : AVENUE_AMENITIES;
  const flats = Array.isArray(extra.flats) ? extra.flats : AVENUE_TYPES.map(t => ({
    title: `3 BHK · Type ${t.type}`,
    area: `${t.area.toLocaleString("en-IN")} sqft · Super built-up`,
    image: `${AVENUE_ASSET}/${t.image}`,
    amenities: [`Brochure references ${t.codes.join(", ")}`, "2 washrooms"],
    note: t.type === 7 ? AVENUE_TYPE7_NOTE : undefined,
  }));
  const inventoryInitialized = extra.avenue_inventory_v2 === true;
  return {
    ...row,
    name: old.name ?? "27th Avenue",
    location: old.location ?? "Kamtaul Road, Mabbi, Darbhanga",
    address: old.address ?? (initialized ? null : "Kamtaul Road, Mabbi, Darbhanga, near Nexa showroom"),
    total_buildings: old.total_buildings ?? 1,
    total_floors: inventoryInitialized ? old.total_floors ?? AVENUE_FLOORS : AVENUE_FLOORS,
    total_flats: inventoryInitialized ? old.total_flats ?? AVENUE_TOTAL_FLATS : AVENUE_TOTAL_FLATS,
    total_units: inventoryInitialized ? old.total_units ?? AVENUE_TOTAL_FLATS : AVENUE_TOTAL_FLATS,
    available_flats: inventoryInitialized ? old.available_flats : null,
    reserved_flats: old.reserved_flats ?? 0,
    sold_flats: old.sold_flats ?? 0,
    sold_units: old.sold_units ?? 0,
    price_min: Number(old.price_min) > 0 ? old.price_min : Number(old.price_from) > 0 ? old.price_from : initialized ? null : AVENUE_STARTING_PRICE,
    price_from: Number(old.price_from) > 0 ? old.price_from : initialized ? 0 : AVENUE_STARTING_PRICE,
    area_min: old.area_min ?? 889, area_max: old.area_max ?? 1314, amenities,
    short_description: old.short_description ?? (initialized ? null : "Exclusively 3 BHK residences across 8 residential floors. Super built-up areas from 889 to 1,314 sqft."),
    description: old.description ?? (initialized ? null : "27th Avenue by Satya Bhawani Plaza Buildcon Pvt. Ltd., presented as S.B.P. Buildcon Pvt. Ltd. in the brochure. Located on Kamtaul Road, Mabbi, Darbhanga, near the Nexa showroom. The project has eight residential floors with eight flats on each floor."),
    thumbnail_url: old.thumbnail_url ?? (initialized ? null : cover),
    hero_banner_url: old.hero_banner_url ?? (initialized ? null : cover),
    cover_url: old.cover_url ?? (initialized ? null : cover),
    gallery, gallery_count: gallery.length,
    floor_plan_count: initialized ? old.floor_plan_count : 9,
    model_count: initialized ? old.model_count : 1,
    three_d_tour_url: old.three_d_tour_url ?? (initialized ? null : `${AVENUE_ASSET}/27th-avenue-exterior.glb`),
    extra: { brochure: { version: 1, file: `${AVENUE_ASSET}/27th-avenue-brochure.pdf`, owner_confirmed_at: "2026-11-10", area_basis: "Super built-up (S/B/U)", type7_note: AVENUE_TYPE7_NOTE }, ...extra, flats: flats.map(plan => {
      if (!plan || !Array.isArray(plan.amenities)) return plan;
      return { ...plan, amenities: plan.amenities.map((item: unknown) => typeof item === "string" ? item.replace(/^Flats /, "Brochure references ") : item) };
    }) },
  } as T;
}

// Keep verified inventory and fill empty positions with unreleased placeholders.
export function completeAvenueInventory(inventory: ProjectInventory): ProjectInventory {
  if (inventory.buildings.length > 1) return inventory;
  const building = inventory.buildings[0] ?? {
    id: "27th-brochure-building", code: "27TH", name: "27th Avenue", description: null,
    total_floors: AVENUE_FLOORS, total_flats: AVENUE_TOTAL_FLATS,
    cover_url: `${AVENUE_ASSET}/exterior-front.webp`,
  };
  const floors = [...inventory.floors];
  const flats = [...inventory.flats];
  if (flats.some(flat => flat.building_id !== building.id || !floors.some(floor => floor.id === flat.floor_id))) return inventory;
  const unitCodes = new Set(flats.map(flat => flat.unit_code));
  for (let number = 1; number <= AVENUE_FLOORS; number++) {
    const floor = floors.find(item => item.number === number) ?? {
      id: `27th-floor-${number}`, building_id: building.id, number, name: `Floor ${number}`,
      total_flats: AVENUE_FLATS_PER_FLOOR, floor_plan_url: null,
    };
    if (!floors.some(item => item.id === floor.id)) floors.push(floor);
    const remaining = AVENUE_FLATS_PER_FLOOR - flats.filter(flat => flat.floor_id === floor.id).length;
    if (remaining <= 0) continue;
    const prefix = `F${String(number).padStart(2, "0")}-`;
    const codes = Array.from({ length: AVENUE_FLATS_PER_FLOOR }, (_, index) =>
      `${prefix}${String(index + 1).padStart(2, "0")}`,
    ).filter(code => !unitCodes.has(code)).slice(0, remaining);
    for (const code of codes) {
      unitCodes.add(code);
      flats.push({
        id: `27th-slot-${code}`, unit_code: code, building_id: building.id, floor_id: floor.id,
        area_sqft: null, bedrooms: 3, bathrooms: 0, balconies: 0, configuration: "3 BHK",
        facing: null, price: null, status: "not_released", booking_status: "closed",
        construction_stage: null, gallery: null, floor_plan_url: null,
      });
    }
  }
  return {
    ...inventory,
    source_kind: flats.length !== inventory.flats.length ? "brochure_owner_confirmed" : inventory.source_kind,
    source_note: "Unreleased slots use provisional labels. Ask for confirmed flat numbers and availability.",
    buildings: [{ ...building, total_floors: floors.length, total_flats: flats.length }],
    floors: floors.sort((a, b) => a.number - b.number),
    flats,
  };
}
