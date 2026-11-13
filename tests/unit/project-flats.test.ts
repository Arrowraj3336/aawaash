import { describe, expect, it } from "vitest";
import { getProjectFlats, getPublicProjectPlans } from "@/lib/project-flats";

describe("project flat cards", () => {
  it("preserves the actual plan count and supplied amenities", () => {
    const flats = getProjectFlats({
      flats: [{ title: "Studio", area: "600 SQft.", image: "https://example.com/studio.jpg", amenities: ["A", "B"] }],
    });

    expect(flats).toHaveLength(1);
    expect(flats[0]).toMatchObject({ title: "Studio", area: "600 SQft.", image: "https://example.com/studio.jpg" });
    expect(flats[0]?.amenities).toEqual(["A", "B"]);
  });

  it("connects the bundled Savitri drawings without inventing floor plans for other projects", () => {
    expect(getPublicProjectPlans("savitri-enclave", {}).map(plan => plan.image)).toEqual([
      "/projects/savitri-enclave/unit-1.webp",
      "/projects/savitri-enclave/unit-2.webp",
      "/projects/savitri-enclave/unit-3.webp",
      "/projects/savitri-enclave/unit-4.webp",
      "/projects/savitri-enclave/unit-5.webp",
    ]);
    const savitri = getPublicProjectPlans("savitri-enclave", {});
    expect(savitri.map(plan => plan.area)).toEqual(["2,016 sq ft", "1,821 sq ft", "1,894 sq ft", "1,782 sq ft", "1,763 sq ft"]);
    expect(savitri[4]?.amenities[0]).toBe("Flats 105, 205, 305, 405");
    expect(getPublicProjectPlans("other", {})).toEqual([]);
  });

  it("retains the uploaded 27th Avenue image and supplies its matching brochure fallback", () => {
    const [plan] = getPublicProjectPlans("27th", {
      flats: [{ title: "3 BHK · Type 1", area: "1,251 sq ft", image: "https://example.com/plan.webp" }],
    });
    expect(plan?.image).toBe("https://example.com/plan.webp");
    expect(plan?.fallbackImage).toBe("/projects/27th-avenue/type-1-b8.webp");
  });
});
