import { describe, it, expect } from "vitest";
import {
  calculateCouponDiscount,
  validateCouponEligibility,
  CouponEligibilityCheck,
  ValidationContext,
} from "./coupon";
import { CouponScope, CouponStatus, CouponApplicableFor, DiscountType } from "@prisma/client";

describe("Coupon Shared Utilities", () => {
  describe("calculateCouponDiscount", () => {
    it("should calculate percentage discount correctly", () => {
      const result = calculateCouponDiscount({
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20, // 20%
        originalAmountPaise: 100000, // Rs 1000
      });
      expect(result.discountPaise).toBe(20000); // Rs 200
      expect(result.finalAmountPaise).toBe(80000); // Rs 800
    });

    it("should respect maxDiscountPaise cap for percentage discount", () => {
      const result = calculateCouponDiscount({
        discountType: DiscountType.PERCENTAGE,
        discountValue: 50, // 50%
        maxDiscountPaise: 15000, // max Rs 150 cap
        originalAmountPaise: 100000, // Rs 1000
      });
      expect(result.discountPaise).toBe(15000);
      expect(result.finalAmountPaise).toBe(85000);
    });

    it("should calculate flat discount correctly", () => {
      const result = calculateCouponDiscount({
        discountType: DiscountType.FLAT,
        discountValue: 25000, // Rs 250
        originalAmountPaise: 100000, // Rs 1000
      });
      expect(result.discountPaise).toBe(25000);
      expect(result.finalAmountPaise).toBe(75000);
    });

    it("should cap flat discount at original amount (100% off max)", () => {
      const result = calculateCouponDiscount({
        discountType: DiscountType.FLAT,
        discountValue: 150000, // Rs 1500 discount on Rs 1000 order
        originalAmountPaise: 100000,
      });
      expect(result.discountPaise).toBe(100000);
      expect(result.finalAmountPaise).toBe(0);
    });
  });

  describe("validateCouponEligibility", () => {
    const baseCoupon: CouponEligibilityCheck = {
      status: CouponStatus.ACTIVE,
      validFrom: new Date("2026-01-01"),
      validTill: new Date("2026-12-31"),
      currentUsageCount: 0,
      maxUsageTotal: 100,
      maxUsagePerUser: 1,
      scope: CouponScope.ALL,
      applicableFor: CouponApplicableFor.ALL,
    };

    const baseContext: ValidationContext = {
      userId: "user-1",
      clientProfileId: "client-1",
      therapistId: "therapist-1",
      purchaseType: "SINGLE",
      orderAmountPaise: 100000,
      userUsageCount: 0,
      now: new Date("2026-06-01"),
    };

    it("should approve valid coupon with scope ALL", () => {
      const result = validateCouponEligibility(baseCoupon, baseContext);
      expect(result.eligible).toBe(true);
    });

    it("should reject paused or expired coupon", () => {
      const paused = validateCouponEligibility(
        { ...baseCoupon, status: CouponStatus.PAUSED },
        baseContext
      );
      expect(paused.eligible).toBe(false);

      const expired = validateCouponEligibility(
        { ...baseCoupon, validTill: new Date("2025-12-31") },
        baseContext
      );
      expect(expired.eligible).toBe(false);
    });

    it("should enforce per user usage limit", () => {
      const result = validateCouponEligibility(baseCoupon, {
        ...baseContext,
        userUsageCount: 1, // maxUsagePerUser is 1
      });
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("maximum uses");
    });

    it("should enforce min order amount", () => {
      const result = validateCouponEligibility(
        { ...baseCoupon, minOrderPaise: 200000 }, // min Rs 2000
        baseContext // order Rs 1000
      );
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("Minimum order amount");
    });

    it("should enforce SPECIFIC_CLIENT scope", () => {
      const coupon: CouponEligibilityCheck = {
        ...baseCoupon,
        scope: CouponScope.SPECIFIC_CLIENT,
        allowedClientIds: ["client-99"],
      };

      const invalid = validateCouponEligibility(coupon, baseContext);
      expect(invalid.eligible).toBe(false);

      const valid = validateCouponEligibility(coupon, {
        ...baseContext,
        clientProfileId: "client-99",
      });
      expect(valid.eligible).toBe(true);
    });

    it("should enforce SPECIFIC_THERAPIST scope", () => {
      const coupon: CouponEligibilityCheck = {
        ...baseCoupon,
        scope: CouponScope.SPECIFIC_THERAPIST,
        allowedTherapistIds: ["therapist-1"],
      };

      const valid = validateCouponEligibility(coupon, baseContext);
      expect(valid.eligible).toBe(true);

      const invalid = validateCouponEligibility(coupon, {
        ...baseContext,
        therapistId: "therapist-2",
      });
      expect(invalid.eligible).toBe(false);
    });

    it("should enforce FIRST_TIME_USER scope", () => {
      const coupon: CouponEligibilityCheck = {
        ...baseCoupon,
        scope: CouponScope.FIRST_TIME_USER,
      };

      const valid = validateCouponEligibility(coupon, {
        ...baseContext,
        userCompletedBookingsCount: 0,
      });
      expect(valid.eligible).toBe(true);

      const invalid = validateCouponEligibility(coupon, {
        ...baseContext,
        userCompletedBookingsCount: 2,
      });
      expect(invalid.eligible).toBe(false);
    });
  });
});
