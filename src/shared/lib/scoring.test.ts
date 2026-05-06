import { describe, expect, it } from "vitest";
import { calculateAssessmentScore, interpretScale } from "./scoring";

describe("interpretScale", () => {
  it("returns the correct band for boundary scores", () => {
    expect(interpretScale(0)).toBe("Not a significant concern");
    expect(interpretScale(29)).toBe("Not a significant concern");
    expect(interpretScale(30)).toBe("Mild strain");
    expect(interpretScale(49)).toBe("Mild strain");
    expect(interpretScale(50)).toBe("Active strain");
    expect(interpretScale(69)).toBe("Active strain");
    expect(interpretScale(70)).toBe("Strong strain");
    expect(interpretScale(100)).toBe("Strong strain");
  });
});

describe("calculateAssessmentScore", () => {
  const zoneA = { key: "zoneA" };
  const zoneB = { key: "zoneB" };

  it("aggregates weights per zone and picks primary zone by scaled score", () => {
    const questions = [
      {
        id: "q1",
        zone: zoneA,
        isReverse: false,
        options: [{ weight: 4 }, { weight: 2 }],
      },
      {
        id: "q2",
        zone: zoneB,
        isReverse: false,
        options: [{ weight: 10 }],
      },
    ];

    const answers = [
      { questionId: "q1", optionWeight: 4 },
      { questionId: "q2", optionWeight: 10 },
    ];

    const result = calculateAssessmentScore(questions, answers);

    expect(result.zones.zoneA).toEqual({ raw: 4, scaled: 100 });
    expect(result.zones.zoneB).toEqual({ raw: 10, scaled: 100 });
    expect(result.primaryZone).toBe("zoneA");
  });

  it("applies reverse scoring using max option weight", () => {
    const questions = [
      {
        id: "q1",
        zone: zoneA,
        isReverse: true,
        options: [{ weight: 0 }, { weight: 10 }],
      },
    ];

    const result = calculateAssessmentScore(questions, [
      { questionId: "q1", optionWeight: 10 },
    ]);

    expect(result.zones.zoneA).toEqual({ raw: 0, scaled: 0 });
  });

  it("skips questions with no options", () => {
    const questions = [
      { id: "bad", zone: zoneA, options: [] },
      {
        id: "good",
        zone: zoneA,
        isReverse: false,
        options: [{ weight: 5 }],
      },
    ];

    const result = calculateAssessmentScore(questions, [
      { questionId: "bad", optionWeight: 99 },
      { questionId: "good", optionWeight: 5 },
    ]);

    expect(result.zones.zoneA).toEqual({ raw: 5, scaled: 100 });
  });
});
