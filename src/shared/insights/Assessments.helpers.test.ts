import { describe, expect, it } from "vitest";
import {
  getAssessmentConfig,
  getZoneContent,
} from "./Assessments";

describe("getAssessmentConfig", () => {
  it("returns config for a known slug", () => {
    const cfg = getAssessmentConfig("stuck-pattern");
    expect(cfg).not.toBeNull();
    expect(cfg?.title).toContain("Stuck");
  });

  it("returns null for unknown slug", () => {
    expect(getAssessmentConfig("nonexistent-assessment-slug")).toBeNull();
  });
});

describe("getZoneContent", () => {
  it("returns band content for valid slug, zone, and score", () => {
    const content = getZoneContent("stuck-pattern", "fear", 25);
    expect(content).not.toBeNull();
    expect(content?.label).toBeTruthy();
    expect(content?.insight.length).toBeGreaterThan(10);
  });

  it("returns null for unknown slug", () => {
    expect(getZoneContent("unknown", "fear", 50)).toBeNull();
  });

  it("returns null for unknown zone", () => {
    expect(getZoneContent("stuck-pattern", "unknown_zone", 50)).toBeNull();
  });
});
