import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canRateSession } from "./ratings";

describe("canRateSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-03T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is false when session has not ended yet", () => {
    const end = new Date("2026-05-03T13:00:00.000Z");
    expect(canRateSession(end)).toBe(false);
  });

  it("is true when session end is in the past", () => {
    const end = new Date("2026-05-03T11:00:00.000Z");
    expect(canRateSession(end)).toBe(true);
  });
});
