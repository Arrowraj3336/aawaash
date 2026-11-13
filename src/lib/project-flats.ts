import { AVENUE_ASSET, AVENUE_TYPES, AVENUE_TYPE7_NOTE } from "./27th-avenue-brochure";
import { SAVITRI_PLANS, SAVITRI_SLUG } from "./savitri-enclave-brochure";
import type { ProjectInventory } from "./inventory.functions";

export type ProjectFlatCard = {
  title: string;
  area: string;
  image: string;
  amenities: string[];
  note?: string;
};

export const DEFAULT_PROJECT_FLATS: ProjectFlatCard[] = [
  {
    title: "1 BHK",
    area: "850 SQft.",
    image: "",
    amenities: ["Open living room", "Modern kitchen", "Private balcony", "Smart storage"],
  },
  {
    title: "2 BHK",
    area: "1,250 SQft.",
    image: "",
    amenities: ["Two bedrooms", "Dining space", "Two balconies", "Utility zone"],
  },
  {
    title: "3 BHK",
    area: "1,900 SQft.",
    image: "",
    amenities: ["Three bedrooms", "Family lounge", "Servant utility", "Panoramic views"],
  },
];

export function getProjectFlats(extra: unknown): ProjectFlatCard[] {
  const raw =
    extra && typeof extra === "object" && !Array.isArray(extra)
      ? (extra as Record<string, unknown>).flats
      : undefined;
  if (!Array.isArray(raw)) return DEFAULT_PROJECT_FLATS;

  return raw.slice(0, 24).filter((item): item is Record<string, unknown> => !!item && typeof item === "object" && !Array.isArray(item)).map((value, index) => {
    const fallback = DEFAULT_PROJECT_FLATS[Math.min(index, DEFAULT_PROJECT_FLATS.length - 1)]!;
    return {
      title: typeof value.title === "string" && value.title.trim() ? value.title : fallback.title,
      area: typeof value.area === "string" && value.area.trim() ? value.area : fallback.area,
      image: typeof value.image === "string" ? value.image : fallback.image,
      amenities: Array.isArray(value.amenities) ? value.amenities.filter((entry): entry is string => typeof entry === "string").slice(0, 4) : fallback.amenities,
      note: typeof value.note === "string" ? value.note : undefined,
    };
  });
}

export function mergeProjectFlats(extra: unknown, flats: ProjectFlatCard[]) {
  const base =
    extra && typeof extra === "object" && !Array.isArray(extra)
      ? (extra as Record<string, unknown>)
      : {};
  return { ...base, flats };
}
type PublicPlan = ProjectFlatCard & { fallbackImage?: string };

export function getPublicProjectPlans(slug: string, extra: unknown, inventory?: ProjectInventory | null): PublicPlan[] {
  const configured = getProjectFlats(extra);
  const bundled = slug === "27th"
    ? AVENUE_TYPES.map(type => ({
      title: `3 BHK · Type ${type.type}`,
      area: `${type.area.toLocaleString("en-IN")} sqft · Super built-up`,
      image: `${AVENUE_ASSET}/${type.image}`,
      amenities: [`Flats ${type.codes.join(", ")}`, "2 washrooms"],
      note: type.type === 7 ? AVENUE_TYPE7_NOTE : undefined,
    }))
    : slug === SAVITRI_SLUG ? SAVITRI_PLANS : [];

  const inventoryPlans: ProjectFlatCard[] = [];
  const seen = new Set<string>();
  for (const flat of inventory?.flats ?? []) {
    const image = flat.floor_plan_url?.trim();
    if (!image || seen.has(image)) continue;
    seen.add(image);
    inventoryPlans.push({
      title: `Flat ${flat.unit_code}`,
      area: flat.area_sqft == null ? "" : `${flat.area_sqft.toLocaleString("en-IN")} sq ft`,
      image,
      amenities: flat.configuration ? [flat.configuration] : [],
    });
  }
  for (const floor of inventory?.floors ?? []) {
    const image = floor.floor_plan_url?.trim();
    if (!image || seen.has(image)) continue;
    seen.add(image);
    inventoryPlans.push({ title: floor.name || `Floor ${floor.number}`, area: "", image, amenities: [] });
  }

  if (configured === DEFAULT_PROJECT_FLATS || (!configured.length && slug !== SAVITRI_SLUG)) return bundled.length ? bundled : inventoryPlans;
  return configured.map(plan => {
    const fallback = [...bundled, ...inventoryPlans].find(source => source.title.toLowerCase() === plan.title.trim().toLowerCase())?.image;
    return { ...plan, image: plan.image.trim() || fallback || "", fallbackImage: fallback };
  });
}
