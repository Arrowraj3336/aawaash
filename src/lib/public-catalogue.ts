export function startingPrice(project: { price_min?: unknown; price_from?: unknown }): number | null {
  for (const value of [project.price_min, project.price_from]) {
    if (typeof value !== "number" && typeof value !== "string") continue;
    const price = Number(value);
    if (Number.isFinite(price) && price > 0) return price;
  }
  return null;
}

type CatalogueProject = Parameters<typeof startingPrice>[0] & {
  name?: string | null;
  location?: string | null;
  address?: string | null;
  description?: string | null;
  short_description?: string | null;
  available_flats?: number | null;
};

type CatalogueFilters = {
  q?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  availability?: "available" | "sold_out" | "any";
  sort?: string;
  limit?: number;
};

/** Filter and rank the same normalized values that appear on the cards. */
export function filterPublicCatalogue<T extends CatalogueProject>(rows: T[], filters: CatalogueFilters): T[] {
  const search = filters.q?.trim().toLowerCase();
  const location = filters.location?.trim().toLowerCase();
  const matching = rows.filter(project => {
    if (search && ![project.name, project.location, project.address, project.description, project.short_description]
      .some(value => value?.toLowerCase().includes(search))) return false;
    if (location && !project.location?.toLowerCase().includes(location)) return false;
    if (filters.availability === "available" && !(Number(project.available_flats) > 0)) return false;
    if (filters.availability === "sold_out" && project.available_flats !== 0) return false;
    const price = startingPrice(project);
    if (filters.priceMin !== undefined && (price === null || price < filters.priceMin)) return false;
    if (filters.priceMax !== undefined && (price === null || price > filters.priceMax)) return false;
    return true;
  });

  if (filters.sort === "price_low" || filters.sort === "price_high") {
    const direction = filters.sort === "price_low" ? 1 : -1;
    matching.sort((a, b) => {
      const first = startingPrice(a);
      const second = startingPrice(b);
      if (first === second) return 0;
      if (first === null) return 1;
      if (second === null) return -1;
      return direction * (first - second);
    });
  }
  return filters.limit === undefined ? matching : matching.slice(0, filters.limit);
}
