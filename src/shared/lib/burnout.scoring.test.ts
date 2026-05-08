import { describe, expect, it } from "vitest";
import { calculateBurnoutScore, mapBurnoutResult } from "./burnout.scoring";

describe("calculateBurnoutScore", () => {
  it("computes dimensions and dominant facet from answer weights", () => {
    const answers = {
      Q1: 4,
      Q2: 4,
      Q3: 4,
      Q4: 4,
      Q5: 4,
      Q6: 4,
      Q7: 4,
    };
    const out = calculateBurnoutScore(answers);
    expect(out.dimensions.energy).toBe(100);
    expect(out.dimensions.mental).toBe(100);
    expect(out.dimensions.disengagement).toBe(100);
    expect(out.burnoutIndex).toBe(100);
    expect(out.dominant).toBe("Energy Depletion");
  });

  it("treats missing question keys as zero", () => {
    const out = calculateBurnoutScore({});
    expect(out.dimensions.energy).toBe(0);
    expect(out.dimensions.mental).toBe(0);
    expect(out.dimensions.disengagement).toBe(0);
    expect(out.burnoutIndex).toBe(0);
    expect(out.dominant).toBe("Energy Depletion");
  });

  it("picks Mental Load when it strictly dominates", () => {
    const out = calculateBurnoutScore({
      Q1: 0,
      Q4: 0,
      Q7: 0,
      Q2: 4,
      Q3: 4,
      Q5: 0,
      Q6: 0,
    });
    expect(out.dominant).toBe("Mental Load");
  });
});

describe("mapBurnoutResult", () => {
  it("maps index ranges to labels", () => {
    expect(mapBurnoutResult(0).label).toBe("Energy Stable");
    expect(mapBurnoutResult(24).label).toBe("Energy Stable");
    expect(mapBurnoutResult(25).label).toBe("Running Low");
    expect(mapBurnoutResult(44).label).toBe("Running Low");
    expect(mapBurnoutResult(45).label).toBe("Mental Overload");
    expect(mapBurnoutResult(64).label).toBe("Mental Overload");
    expect(mapBurnoutResult(65).label).toBe("Burnout Mode");
  });
});
