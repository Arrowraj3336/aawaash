import { describe, expect, it } from "vitest";
import { applyAvenueBrochure } from "@/lib/27th-avenue-brochure";
import { filterPublicCatalogue, startingPrice } from "@/lib/public-catalogue";

const listings = [
  { slug: "27th", name: "27th Avenue", price_min: null, price_from: 0 },
  { slug: "p-shree", name: "P Shree", price_min: null, price_from: 0 },
  { slug: "savitri-enclave", name: "Savitri Enclave", price_min: 10500000, price_from: 0 },
].map(applyAvenueBrochure);

describe("public catalogue", () => {
  it("sorts by the displayed price, with unpriced projects last in either direction", () => {
    expect(filterPublicCatalogue(listings, { sort: "price_high" }).map(p => p.slug))
      .toEqual(["savitri-enclave", "27th", "p-shree"]);
    expect(filterPublicCatalogue(listings, { sort: "price_low" }).map(p => p.slug))
      .toEqual(["27th", "savitri-enclave", "p-shree"]);
  });

  it("matches the displayed project name and price before applying the limit", () => {
    expect(filterPublicCatalogue(listings, { q: " 27th avenue ", priceMin: 6000000, limit: 1 })
      .map(p => p.slug)).toEqual(["27th"]);
  });

  it("preserves a starting price saved by an administrator", () => {
    expect(startingPrice(applyAvenueBrochure({ slug: "27th", price_min: 6500000, price_from: 0 })))
      .toBe(6500000);
  });
});
