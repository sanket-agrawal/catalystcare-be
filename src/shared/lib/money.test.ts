import { describe, expect, it } from "vitest";
import {
  calculateCommission,
  calculateProgramComissions,
  paiseToRupees,
  rupeesToPaise,
} from "./money";

describe("rupeesToPaise", () => {
  it("converts number and string rupees to paise with rounding", () => {
    expect(rupeesToPaise(10)).toBe(1000);
    expect(rupeesToPaise(99.99)).toBe(9999);
    expect(rupeesToPaise("12.5")).toBe(1250);
  });
});

describe("paiseToRupees", () => {
  it("formats paise as rupee string with two decimals", () => {
    expect(paiseToRupees(1000)).toBe("10.00");
    expect(paiseToRupees(1)).toBe("0.01");
  });
});

describe("calculateCommission", () => {
  const rate = {
    id: "r1",
    platformPercent: 10,
    gatewayPercent: 2,
  };

  it("computes fees and payout from amount and rate", () => {
    const out = calculateCommission({
      amountPaise: 10_000,
      commissionRate: rate,
    });
    expect(out.platformFeePaise).toBe(1000);
    expect(out.gatewayFeePaise).toBe(200);
    expect(out.payoutAmountPaise).toBe(8800);
    expect(out.commissionRateId).toBe("r1");
  });

  it("treats null rate as zero percent fees", () => {
    const out = calculateCommission({
      amountPaise: 5000,
      commissionRate: null,
    });
    expect(out.platformFeePaise).toBe(0);
    expect(out.gatewayFeePaise).toBe(0);
    expect(out.payoutAmountPaise).toBe(5000);
    expect(out.commissionRateId).toBeNull();
  });
});

describe("calculateProgramComissions", () => {
  it("uses 15% platform fee up to 2000 INR (200000 paise)", () => {
    const out = calculateProgramComissions({
      amountPaise: 200_000,
      commissionRate: { id: "x", platformPercent: 0, gatewayPercent: 0 },
    });
    expect(out.platformPercent).toBe(15);
    expect(out.platformFeePaise).toBe(30_000);
  });

  it("uses 10% platform fee just above 2000 INR", () => {
    const out = calculateProgramComissions({
      amountPaise: 200_001,
      commissionRate: { id: "x", platformPercent: 0, gatewayPercent: 0 },
    });
    expect(out.platformPercent).toBe(10);
    expect(out.platformFeePaise).toBe(20_000);
  });

  it("uses 5% platform fee above 10000 INR", () => {
    const out = calculateProgramComissions({
      amountPaise: 1_000_001,
      commissionRate: { id: "x", platformPercent: 0, gatewayPercent: 1 },
    });
    expect(out.platformPercent).toBe(5);
    expect(out.platformFeePaise).toBe(50_000);
    expect(out.gatewayFeePaise).toBe(10_000);
    expect(out.payoutAmountPaise).toBe(1_000_001 - 50_000 - 10_000);
  });
});
