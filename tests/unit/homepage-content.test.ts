import { describe, expect, it } from "vitest";
import { mergeHomepage } from "@/lib/homepage-content";

describe("homepage content merging", () => {
  it("keeps an intentionally empty list and new editor copy after a save", () => {
    const saved = mergeHomepage({ hero: { items: [], copy: { action: "Browse homes" } }, footer: { enabled: false } });
    expect(saved.hero.items).toEqual([]);
    expect(saved.hero.copy?.action).toBe("Browse homes");
    expect(saved.hero.copy?.searchLabel).toBe("Search projects");
    expect(saved.footer.enabled).toBe(false);
  });

  it("preserves an edited hero image while filling omitted defaults", () => {
    const result = mergeHomepage({
      hero: { enabled: true, image: "https://example.com/real-building.png" },
    });

    expect(result.hero.image).toBe("https://example.com/real-building.png");
    expect(result.hero.title).toBe("More Than Just A");
    expect(result.projects.enabled).toBe(true);
  });
});