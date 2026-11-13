import type { ProjectInventory } from "./inventory.functions";
import { optionalProjectMedia } from "./project-structure";
import { z } from "zod";

export const P_SHREE_SLUG = "p-shree";
export const P_SHREE_ASSET = "/projects/p-shree";
export const P_SHREE_ID = "81ddf13e-4a6e-4d6e-8acd-9c1d7ab75582";
export const P_SHREE_FLOORS = 5;
export const P_SHREE_STARTING_PRICE = 4_500_000;

type UnitAreas = [builtUp: number, common: number, superBuiltUp: number];

// The confirmed inventory consists of the 28 units identified in the area schedule.
const units = (tower: string, areas: UnitAreas[]) => areas.map(([builtUp, common, superBuiltUp], index) => ({
  number: `${tower}${101 + index}`,
  bedrooms: tower === "B" && (index === 4 || index === 5) ? 2 : 3,
  builtUp,
  common,
  superBuiltUp,
}));

export const P_SHREE_TOWERS = [
  { name: "A", units: units("A", [[929,327,1256],[929,327,1256],[880,310,1190],[880,310,1190],[869,306,1175],[869,306,1175],[880,310,1190],[880,310,1190],[913,321,1234],[913,321,1234]]) },
  { name: "B", units: units("B", [[929,323,1252],[929,323,1252],[880,306,1186],[880,306,1186],[720,251,971],[720,251,971],[880,306,1186],[880,306,1186],[913,318,1231],[913,318,1231]]) },
  { name: "C", units: units("C", [[1002,350,1352],[1002,350,1352],[946,331,1277],[946,331,1277],[946,331,1277],[946,331,1277],[985,344,1329],[985,344,1329]]) },
];

export const P_SHREE_GALLERY = [
  "entrance", "street-corner", "courtyard", "three-tower-elevation",
  "front-elevation", "aerial-front", "aerial-rear", "ground-level",
].map(name => `${P_SHREE_ASSET}/${name}.webp`);

export const P_SHREE_TOTAL = P_SHREE_TOWERS.reduce((sum, tower) => sum + tower.units.length, 0);
export const P_SHREE_DEVELOPER = "S.B.P. Buildcon Pvt. Ltd.";
export const P_SHREE_ARCHITECT = "Sukriti Architects & Planners";
export const P_SHREE_SUMMARY = "Proposed 2 and 3 BHK residences across three towers in Chandanpatti, Darbhanga.";

export const P_SHREE_PROJECT = {
  id: P_SHREE_ID,
  slug: P_SHREE_SLUG,
  name: "P Shree",
  location: "Chandanpatti, Darbhanga",
  address: "Chandanpatti, Darbhanga, Bihar",
  project_type: "flat_inventory",
  construction_status: "planning",
  visibility: "public",
  tag: "Proposed development",
  description: P_SHREE_SUMMARY,
  short_description: P_SHREE_SUMMARY,
  display_priority: 0,
  created_at: "2026-11-12T00:00:00Z",
  price_from: P_SHREE_STARTING_PRICE,
  price_min: P_SHREE_STARTING_PRICE,
  area_min: 971,
  area_max: 1352,
  total_buildings: P_SHREE_TOWERS.length,
  total_floors: P_SHREE_FLOORS,
  total_flats: P_SHREE_TOTAL,
  total_units: P_SHREE_TOTAL,
  available_flats: null,
  reserved_flats: 0,
  sold_flats: 0,
  completion_percent: 0,
  hero_banner_url: P_SHREE_GALLERY[0],
  thumbnail_url: P_SHREE_GALLERY[0],
  cover_url: P_SHREE_GALLERY[0],
  gallery: P_SHREE_GALLERY,
  gallery_count: P_SHREE_GALLERY.length,
  floor_plan_count: P_SHREE_TOWERS.length,
  extra: { developer: P_SHREE_DEVELOPER, architect: P_SHREE_ARCHITECT },
};

export const pShreeContentSchema = z.object({
  highlights: z.array(z.string().trim().min(1).max(120)).max(3).optional(),
  areaSchedule: optionalProjectMedia,
  renderings: optionalProjectMedia,
  availabilityNote: z.string().trim().max(300).optional(),
  towers: z.record(z.string(), z.object({
    name: z.string().trim().max(40),
    image: optionalProjectMedia,
    plan: optionalProjectMedia,
  })).optional(),
});

const DEFAULT_CONTENT = {
  highlights: ["2 and 3 BHK residences", "Three towers in Chandanpatti, Darbhanga", "971–1,352 sq ft super built-up area"],
  areaSchedule: `${P_SHREE_ASSET}/area-schedule.pdf`,
  renderings: `${P_SHREE_ASSET}/architectural-visualizations.pdf`,
  availabilityNote: "Contact sales to confirm current availability.",
};

export function getPShreeContent(extra: unknown) {
  const record = extra && typeof extra === "object" ? extra as Record<string, unknown> : {};
  const result = pShreeContentSchema.safeParse(record.p_shree);
  const saved = result.success ? result.data : {};
  return {
    highlights: saved.highlights ?? DEFAULT_CONTENT.highlights,
    areaSchedule: saved.areaSchedule === undefined ? DEFAULT_CONTENT.areaSchedule : saved.areaSchedule,
    renderings: saved.renderings === undefined ? DEFAULT_CONTENT.renderings : saved.renderings,
    availabilityNote: saved.availabilityNote ?? DEFAULT_CONTENT.availabilityNote,
    towers: P_SHREE_TOWERS.map(({ name: code }) => {
      const path = `${P_SHREE_ASSET}/tower-${code.toLowerCase()}`;
      const tower = saved.towers?.[code];
      return {
        code,
        name: tower?.name || `Tower ${code}`,
        image: tower?.image === undefined ? `${path}.webp` : tower.image,
        plan: tower?.plan === undefined ? `${path}.pdf` : tower.plan,
      };
    }),
  };
}

export function getPShreeBrochureInventory(projectId: string): ProjectInventory {
  const buildings: ProjectInventory["buildings"] = [];
  const floors: ProjectInventory["floors"] = [];
  const flats: ProjectInventory["flats"] = [];
  for (const tower of P_SHREE_TOWERS) {
    const buildingId = `p-shree-tower-${tower.name}`;
    const floorId = `${buildingId}-1`;
    buildings.push({
      id: buildingId, code: tower.name, name: `Tower ${tower.name}`, description: null,
      total_floors: 1, total_flats: tower.units.length, cover_url: null,
    });
    floors.push({
      id: floorId, building_id: buildingId, number: 1, name: "Floor 1",
      total_flats: tower.units.length, floor_plan_url: null,
    });
    for (const unit of tower.units) {
      flats.push({
        id: `p-shree-${unit.number}`, unit_code: unit.number, building_id: buildingId, floor_id: floorId,
        floor_number: 1, area_sqft: unit.superBuiltUp, area_basis: "Super built-up", bedrooms: unit.bedrooms,
        bathrooms: 0, balconies: 0, configuration: `${unit.bedrooms} BHK`, facing: null, price: null,
        status: "not_released", booking_status: "closed", construction_stage: null, gallery: null, floor_plan_url: null,
      });
    }
  }
  return { project_id: projectId, source_kind: "brochure_owner_confirmed", buildings, floors, flats };
}

export function applyPShreeDocuments<T extends { slug: string }>(project: T): T {
  if (project.slug !== P_SHREE_SLUG) return project;
  const row = project as T & Record<string, unknown>;
  const extra = row.extra && typeof row.extra === "object" && !Array.isArray(row.extra) ? row.extra as Record<string, unknown> : {};
  const initialized = extra.p_shree_inventory_initialized === true;
  const hasPrice = Number(row.price_min) > 0 || Number(row.price_from) > 0;
  const gallery = Array.isArray(row.gallery) && row.gallery.length ? row.gallery : P_SHREE_GALLERY;
  return {
    ...project,
    short_description: row.short_description || P_SHREE_SUMMARY,
    address: row.address || P_SHREE_PROJECT.address,
    area_min: row.area_min || P_SHREE_PROJECT.area_min,
    area_max: row.area_max || P_SHREE_PROJECT.area_max,
    total_buildings: row.total_buildings || P_SHREE_PROJECT.total_buildings,
    total_floors: row.total_floors || P_SHREE_FLOORS,
    total_flats: initialized ? row.total_flats ?? P_SHREE_TOTAL : P_SHREE_TOTAL,
    total_units: initialized ? row.total_units ?? P_SHREE_TOTAL : P_SHREE_TOTAL,
    ...(!initialized && !hasPrice ? { price_from: P_SHREE_STARTING_PRICE, price_min: P_SHREE_STARTING_PRICE } : {}),
    available_flats: row.construction_status === "planning" && !row.available_flats && !row.sold_flats && !row.reserved_flats
      ? null : row.available_flats,
    hero_banner_url: row.hero_banner_url || P_SHREE_GALLERY[0],
    cover_url: row.cover_url || P_SHREE_GALLERY[0],
    thumbnail_url: row.thumbnail_url || P_SHREE_GALLERY[0],
    gallery,
    gallery_count: gallery.length,
    floor_plan_count: row.floor_plan_count || P_SHREE_TOWERS.length,
    extra: { ...P_SHREE_PROJECT.extra, ...extra },
  };
}
