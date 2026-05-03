import { describe, expect, it } from "vitest";
import { formatToIST, timeStrToDate } from "./date";

describe("timeStrToDate", () => {
  it("interprets HH:mm on the base calendar day as Asia/Kolkata and returns UTC", () => {
    const base = new Date(2026, 4, 3);
    const utc = timeStrToDate(base, "14:30");
    expect(utc.toISOString()).toBe("2026-05-03T09:00:00.000Z");
  });

  it("handles midnight IST", () => {
    const base = new Date(2026, 0, 15);
    const utc = timeStrToDate(base, "00:00");
    expect(utc.toISOString()).toBe("2026-01-14T18:30:00.000Z");
  });
});

describe("formatToIST", () => {
  it("formats an ISO string in en-IN with Asia/Kolkata", () => {
    const s = formatToIST("2026-05-03T09:00:00.000Z");
    expect(s).toMatch(/2026/);
    expect(s).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});
