import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getClientBookingPermissions } from "./client.helper";

describe("getClientBookingPermissions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-03T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows join when session starts within 15 minutes", () => {
    const start = new Date("2026-05-03T12:10:00.000Z");
    const p = getClientBookingPermissions(start);
    expect(p.canJoin).toBe(true);
    expect(p.canReschedule).toBe(false);
    expect(p.canCancel).toBe(false);
  });

  it("allows reschedule when more than 12 hours before start", () => {
    const start = new Date("2026-05-04T12:00:00.000Z");
    const p = getClientBookingPermissions(start);
    expect(p.canReschedule).toBe(true);
    expect(p.canCancel).toBe(true);
  });
});
