import { describe, expect, it } from "vitest";
import { zoneInsights } from "./assessment.scoring";

describe("zoneInsights", () => {
  it("defines non-empty insight text for core zone keys", () => {
    expect(zoneInsights.ENERGY_DEPLETION.length).toBeGreaterThan(20);
    expect(zoneInsights.MENTAL_LOAD).toContain("Cognitive");
    expect(zoneInsights.OVERLOAD).toContain("attention");
  });
});
