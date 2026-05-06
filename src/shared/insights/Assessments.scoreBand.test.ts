import { describe, expect, it } from "vitest";
import { getScoreBand } from "./Assessments";

describe("getScoreBand", () => {
  it("maps scores to assessment bands", () => {
    expect(getScoreBand(0)).toBe("0-29");
    expect(getScoreBand(29)).toBe("0-29");
    expect(getScoreBand(30)).toBe("30-49");
    expect(getScoreBand(49)).toBe("30-49");
    expect(getScoreBand(50)).toBe("50-69");
    expect(getScoreBand(69)).toBe("50-69");
    expect(getScoreBand(70)).toBe("70-100");
    expect(getScoreBand(100)).toBe("70-100");
  });
});
