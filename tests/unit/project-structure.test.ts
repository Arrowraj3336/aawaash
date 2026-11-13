import { describe, expect, it } from "vitest";
import { floorNumber, inventoryIdentifier, optionalInventoryNumber, optionalProjectMedia, suggestFloorNumber, suggestTowerCode } from "@/lib/project-structure";

describe("project structure editor", () => {
  it("suggests distinct tower codes for ordinary tower names and retries", () => {
    expect(suggestTowerCode("Tower A", [])).toBe("A");
    expect(suggestTowerCode("Tower B", ["A"])).toBe("B");
    expect(suggestTowerCode("Tower A", ["a", "A-2"])).toBe("A-3");
    expect(inventoryIdentifier.safeParse("   ").success).toBe(false);
  });

  it("keeps ground and basement floors distinct from empty input", () => {
    expect(floorNumber.parse("0")).toBe(0);
    expect(floorNumber.parse("-1")).toBe(-1);
    expect(floorNumber.safeParse("   ").success).toBe(false);
    expect(suggestFloorNumber([0, 1, 3])).toBe(2);
  });

  it("keeps optional prices empty and accepts bundled plan paths", () => {
    expect(optionalInventoryNumber.parse("")).toBeNull();
    expect(optionalInventoryNumber.parse("0")).toBe(0);
    expect(optionalProjectMedia.parse("/projects/p-shree/tower-a.pdf")).toBe("/projects/p-shree/tower-a.pdf");
    expect(optionalProjectMedia.safeParse("//example.com/plan.pdf").success).toBe(false);
  });
});
