import { CouponScope, CouponStatus, CouponApplicableFor, DiscountType } from "@prisma/client";

export interface CalculateDiscountInput {
  discountType: DiscountType;
  discountValue: number; // For PERCENTAGE: e.g. 20 (for 20%). For FLAT: value in paise (e.g. 20000 for Rs.200)
  maxDiscountPaise?: number | null;
  originalAmountPaise: number;
}

export interface CalculateDiscountResult {
  discountPaise: number;
  finalAmountPaise: number;
}

export function calculateCouponDiscount(input: CalculateDiscountInput): CalculateDiscountResult {
  const { discountType, discountValue, maxDiscountPaise, originalAmountPaise } = input;

  if (originalAmountPaise <= 0) {
    return { discountPaise: 0, finalAmountPaise: 0 };
  }

  let rawDiscountPaise = 0;

  if (discountType === DiscountType.PERCENTAGE) {
    rawDiscountPaise = Math.round((originalAmountPaise * discountValue) / 100);
    if (maxDiscountPaise && maxDiscountPaise > 0) {
      rawDiscountPaise = Math.min(rawDiscountPaise, maxDiscountPaise);
    }
  } else if (discountType === DiscountType.FLAT) {
    rawDiscountPaise = Math.round(discountValue);
  }

  // Ensure discount doesn't exceed original amount
  const discountPaise = Math.min(Math.max(0, rawDiscountPaise), originalAmountPaise);
  const finalAmountPaise = Math.max(0, originalAmountPaise - discountPaise);

  return {
    discountPaise,
    finalAmountPaise,
  };
}

export interface CouponEligibilityCheck {
  status: CouponStatus;
  validFrom: Date;
  validTill?: Date | null;
  maxUsageTotal?: number | null;
  currentUsageCount: number;
  maxUsagePerUser: number;
  scope: CouponScope;
  applicableFor: CouponApplicableFor;
  minOrderPaise?: number | null;
  allowedClientIds?: string[];
  allowedTherapistIds?: string[];
  allowedCategoryIds?: string[];
}

export interface ValidationContext {
  userId: string;
  clientProfileId: string;
  therapistId?: string;
  therapistCategoryIds?: string[];
  purchaseType: "SINGLE" | "PROGRAM";
  orderAmountPaise: number;
  userUsageCount: number;
  userCompletedBookingsCount?: number;
  now?: Date;
}

export interface ValidationResult {
  eligible: boolean;
  reason?: string;
}

export function validateCouponEligibility(
  coupon: CouponEligibilityCheck,
  context: ValidationContext
): ValidationResult {
  const now = context.now || new Date();

  // 1. Status check
  if (coupon.status !== CouponStatus.ACTIVE) {
    return { eligible: false, reason: `Coupon is ${coupon.status.toLowerCase()}` };
  }

  // 2. Validity date range
  if (now < new Date(coupon.validFrom)) {
    return { eligible: false, reason: "Coupon is not yet active" };
  }
  if (coupon.validTill && now > new Date(coupon.validTill)) {
    return { eligible: false, reason: "Coupon has expired" };
  }

  // 3. Purchase type applicability
  if (coupon.applicableFor !== CouponApplicableFor.ALL) {
    if (
      (coupon.applicableFor === CouponApplicableFor.SINGLE && context.purchaseType !== "SINGLE") ||
      (coupon.applicableFor === CouponApplicableFor.PROGRAM && context.purchaseType !== "PROGRAM")
    ) {
      return {
        eligible: false,
        reason: `Coupon is not valid for ${context.purchaseType.toLowerCase()} purchases`,
      };
    }
  }

  // 4. Usage limit checks
  if (
    coupon.maxUsageTotal !== null &&
    coupon.maxUsageTotal !== undefined &&
    coupon.maxUsageTotal > 0
  ) {
    if (coupon.currentUsageCount >= coupon.maxUsageTotal) {
      return { eligible: false, reason: "Coupon maximum usage limit reached" };
    }
  }

  if (context.userUsageCount >= coupon.maxUsagePerUser) {
    return { eligible: false, reason: "You have reached your maximum uses for this coupon" };
  }

  // 5. Minimum order amount check
  if (
    coupon.minOrderPaise !== null &&
    coupon.minOrderPaise !== undefined &&
    coupon.minOrderPaise > 0
  ) {
    if (context.orderAmountPaise < coupon.minOrderPaise) {
      return {
        eligible: false,
        reason: `Minimum order amount of ₹${(coupon.minOrderPaise / 100).toFixed(2)} required`,
      };
    }
  }

  // 6. Scope check
  switch (coupon.scope) {
    case CouponScope.ALL:
      break;

    case CouponScope.SPECIFIC_CLIENT:
      if (!coupon.allowedClientIds || !coupon.allowedClientIds.includes(context.clientProfileId)) {
        return { eligible: false, reason: "This coupon is not valid for your account" };
      }
      break;

    case CouponScope.SPECIFIC_THERAPIST:
      if (
        !context.therapistId ||
        !coupon.allowedTherapistIds ||
        !coupon.allowedTherapistIds.includes(context.therapistId)
      ) {
        return { eligible: false, reason: "This coupon is not valid for the selected therapist" };
      }
      break;

    case CouponScope.SPECIFIC_CLIENT_THERAPIST:
      const clientMatch =
        coupon.allowedClientIds && coupon.allowedClientIds.includes(context.clientProfileId);
      const therapistMatch =
        context.therapistId &&
        coupon.allowedTherapistIds &&
        coupon.allowedTherapistIds.includes(context.therapistId);
      if (!clientMatch || !therapistMatch) {
        return {
          eligible: false,
          reason: "This coupon is not valid for this client and therapist combination",
        };
      }
      break;

    case CouponScope.FIRST_TIME_USER:
      if ((context.userCompletedBookingsCount ?? 0) > 0) {
        return { eligible: false, reason: "This coupon is only valid for first-time users" };
      }
      break;

    case CouponScope.CATEGORY:
      if (
        !context.therapistCategoryIds ||
        !coupon.allowedCategoryIds ||
        !context.therapistCategoryIds.some((catId) => coupon.allowedCategoryIds!.includes(catId))
      ) {
        return {
          eligible: false,
          reason: "This coupon is not valid for the selected therapist category",
        };
      }
      break;
  }

  return { eligible: true };
}
