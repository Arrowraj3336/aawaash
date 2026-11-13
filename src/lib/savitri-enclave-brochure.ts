import type { ProjectInventory } from "./inventory.functions";

export const SAVITRI_SLUG = "savitri-enclave";
export const SAVITRI_ASSET = "/projects/savitri-enclave";
export const SAVITRI_ADDRESS = "Near JP Chowk, Bhagwan Das Mohalla, Darbhanga, Bihar";
export const SAVITRI_DEVELOPER = "S.B.P. Buildcon Pvt. Ltd.";
export const SAVITRI_AREA_MIN = 1763;
export const SAVITRI_AREA_MAX = 2016;
const FLOOR_COUNT = 4;

// Savitri Enclave brochure, pp. 6–10. The area basis is unspecified.
const unitTypes = [
  { type: 1, area: 2016, balconies: 4 },
  { type: 2, area: 1821, balconies: 3 },
  { type: 3, area: 1894, balconies: 4 },
  { type: 4, area: 1782, balconies: 3 },
  { type: 5, area: 1763, balconies: 4 },
];

const planImage = (type: number) => `${SAVITRI_ASSET}/unit-${type}.webp`;
export const SAVITRI_PLANS = unitTypes.map(({ type, area, balconies }) => ({
  title: `3 BHK · Unit ${type}`,
  area: `${area.toLocaleString("en-IN")} sq ft`,
  image: planImage(type),
  amenities: [
    `Flats ${Array.from({ length: FLOOR_COUNT }, (_, index) => (index + 1) * 100 + type).join(", ")}`,
    "Drawing and dining · Kitchen",
    `${balconies} balconies`,
    "3 washrooms",
  ],
}));

export const SAVITRI_GALLERY = [
  "exterior-front", "exterior-angle", "site-plan", "typical-floor-plan",
].map(name => `${SAVITRI_ASSET}/${name}.webp`);

const specifications = [
  ["Structure", "Earthquake-resistant RCC frame with brickwork in cement mortar."],
  ["Doors and windows", "Laminate-finished flush doors and two-track aluminium or uPVC sliding windows with mild-steel safety grilles."],
  ["Flooring", "Glazed vitrified tiles in bedrooms, living areas and kitchen. Anti-skid vitrified tiles in washrooms and balconies."],
  ["Kitchen", "Granite counter, stainless steel sink, wall tiles above the counter, hot and cold water, and an RO water point."],
  ["Bathrooms", "Chinaware and CP fittings with concealed hot and cold water supply."],
  ["Electrical and intercom", "Concealed copper wiring, modular switches and an intercom in every flat."],
  ["Finishes", "Paint over white putty on internal walls, exterior paint and railings as shown in the elevation."],
  ["Elevator", "Automatic elevator by Johnson, Kone or equivalent."],
].map(([title, description]) => ({ title, description }));

const isLegacyMedia = (value: unknown) => typeof value === "string" &&
  /(?:^\/images\/|\/__l5e\/assets-v1\/[\w-]+\/)savitri-(?:enclave-(?:hero|facade)|facade|hero)\.(?:png|jpe?g)(?:[?#].*)?$/i.test(value);

export function applySavitriBrochure<T extends { slug?: string | null }>(project: T): T {
  if (project.slug !== SAVITRI_SLUG) return project;

  const saved = project as Record<string, unknown>;
  const extra = saved.extra && typeof saved.extra === "object" && !Array.isArray(saved.extra)
    ? saved.extra as Record<string, unknown>
    : {};
  const cover = SAVITRI_GALLERY[0];
  const photo = (value: unknown) => !value || isLegacyMedia(value) ? cover : value;
  const gallery = Array.isArray(saved.gallery) ? saved.gallery.filter(image => !isLegacyMedia(image)) : [];
  const projectGallery = gallery.length ? gallery : SAVITRI_GALLERY;

  return {
    ...project,
    address: saved.address || SAVITRI_ADDRESS,
    total_floors: saved.total_floors || FLOOR_COUNT,
    total_flats: saved.total_flats || FLOOR_COUNT * unitTypes.length,
    total_units: saved.total_units || FLOOR_COUNT * unitTypes.length,
    area_min: saved.area_min || SAVITRI_AREA_MIN,
    area_max: saved.area_max || SAVITRI_AREA_MAX,
    short_description: !saved.short_description || saved.short_description === "Unveil a new chapter of refined living."
      ? "3 BHK apartments near JP Chowk, Darbhanga, with five layouts from 1,763 to 2,016 sq ft."
      : saved.short_description,
    hero_banner_url: photo(saved.hero_banner_url),
    cover_url: photo(saved.cover_url),
    thumbnail_url: photo(saved.thumbnail_url),
    gallery: projectGallery,
    gallery_count: new Set([photo(saved.hero_banner_url), photo(saved.cover_url), photo(saved.thumbnail_url), ...projectGallery]).size,
    floor_plan_count: Array.isArray(extra.flats) ? extra.flats.length : SAVITRI_PLANS.length,
    extra: { developer: SAVITRI_DEVELOPER, specifications, ...extra, flats: extra.flats ?? SAVITRI_PLANS },
  } as T;
}

/** Keep live unit IDs and sale statuses. Fill missing plan details from the brochure. */
export function addSavitriInventoryPlans(inventory: ProjectInventory): ProjectInventory {
  return {
    ...inventory,
    floors: inventory.floors.map(floor => floor.number >= 1 && floor.number <= FLOOR_COUNT
      ? { ...floor, floor_plan_url: floor.floor_plan_url || `${SAVITRI_ASSET}/typical-floor-plan.webp` }
      : floor),
    flats: inventory.flats.map(flat => {
      if (!/^[1-4]0[1-5]$/.test(flat.unit_code)) return flat;
      const type = unitTypes[Number(flat.unit_code[2]) - 1];
      return {
        ...flat,
        area_sqft: flat.area_sqft ?? type.area,
        configuration: flat.configuration || `3 BHK · Unit ${type.type}`,
        floor_plan_url: flat.floor_plan_url || planImage(type.type),
      };
    }),
  };
}
