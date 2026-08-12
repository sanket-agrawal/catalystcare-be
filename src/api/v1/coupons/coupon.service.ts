import { prisma } from "../../../infrastructure/prisma/client";
import ApiError from "../../../shared/utils/ApiError";
import { ApplyCouponInput } from "./coupon.dto";
import { rupeesToPaise } from "../../../shared/lib/money";
import {
  calculateCouponDiscount,
  validateCouponEligibility,
  ValidationContext,
} from "../../../shared/lib/coupon";
import { Decimal } from "@prisma/client/runtime/library";

export const clientCouponService = {
  validateAndCalculateDiscount: async (
    data: ApplyCouponInput,
    userId: string,
    clientProfileId: string
  ) => {
    const code = data.code.toUpperCase().trim();

    let originalAmountPaise = 0;
    let therapistId = data.therapistId;
    let therapistCategoryIds: string[] = [];

    if (data.purchaseType === "SINGLE") {
      if (!data.slotId) {
        throw new ApiError(400, "slotId is required for single session coupon validation");
      }

      const slot = await prisma.availabilitySlot.findUnique({
        where: { id: data.slotId },
        include: {
          availability: {
            include: {
              therapist: {
                include: {
                  categories: { select: { id: true } },
                },
              },
            },
          },
        },
      });

      if (!slot) {
        throw new ApiError(404, "Slot not found");
      }

      const therapist = slot.availability.therapist;
      if (!therapist) {
        throw new ApiError(404, "Therapist not found for slot");
      }

      therapistId = therapist.id;
      therapistCategoryIds = therapist.categories.map((c) => c.id);

      const feeRupees = Number(therapist.sessionFee || 0);
      originalAmountPaise = rupeesToPaise(feeRupees);
    } else if (data.purchaseType === "PROGRAM") {
      if (!data.planId) {
        throw new ApiError(400, "planId is required for program coupon validation");
      }

      const plan = await prisma.programPlan.findFirst({
        where: { id: data.planId, isActive: true },
        include: {
          program: {
            include: {
              therapist: {
                include: {
                  categories: { select: { id: true } },
                },
              },
            },
          },
        },
      });

      if (!plan) {
        throw new ApiError(404, "Program plan not found or inactive");
      }

      originalAmountPaise = plan.pricePaise;
      therapistId = plan.program.therapistId;
      therapistCategoryIds = plan.program.therapist.categories.map((c) => c.id);
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      throw new ApiError(404, "Invalid coupon code");
    }

    // Fetch user usage count for this coupon
    const userUsageCount = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        userId,
      },
    });

    // Fetch completed bookings count for first-time user check
    const userCompletedBookingsCount = await prisma.booking.count({
      where: {
        clientId: clientProfileId,
        status: "COMPLETED",
      },
    });

    const validationContext: ValidationContext = {
      userId,
      clientProfileId,
      therapistId,
      therapistCategoryIds,
      purchaseType: data.purchaseType,
      orderAmountPaise: originalAmountPaise,
      userUsageCount,
      userCompletedBookingsCount,
    };

    const eligibility = validateCouponEligibility(
      {
        status: coupon.status,
        validFrom: coupon.validFrom,
        validTill: coupon.validTill,
        maxUsageTotal: coupon.maxUsageTotal,
        currentUsageCount: coupon.currentUsageCount,
        maxUsagePerUser: coupon.maxUsagePerUser,
        scope: coupon.scope,
        applicableFor: coupon.applicableFor,
        minOrderPaise: coupon.minOrderPaise,
        allowedClientIds: coupon.allowedClientIds,
        allowedTherapistIds: coupon.allowedTherapistIds,
        allowedCategoryIds: coupon.allowedCategoryIds,
      },
      validationContext
    );

    if (!eligibility.eligible) {
      throw new ApiError(400, eligibility.reason || "Coupon is not applicable");
    }

    const discountResult = calculateCouponDiscount({
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      maxDiscountPaise: coupon.maxDiscountPaise,
      originalAmountPaise,
    });

    return {
      couponId: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      originalAmountPaise,
      discountPaise: discountResult.discountPaise,
      finalAmountPaise: discountResult.finalAmountPaise,
    };
  },

  getWebsiteCoupons: async (applicableFor?: "SINGLE" | "PROGRAM") => {
    const now = new Date();

    const where: any = {
      status: "ACTIVE",
      isVisibleOnWebsite: true,
      validFrom: { lte: now },
      OR: [{ validTill: null }, { validTill: { gte: now } }],
    };

    if (applicableFor) {
      where.applicableFor = {
        in: [applicableFor, "ALL"],
      };
    }

    const coupons = await prisma.coupon.findMany({
      where,
      select: {
        id: true,
        code: true,
        description: true,
        discountType: true,
        discountValue: true,
        maxDiscountPaise: true,
        minOrderPaise: true,
        scope: true,
        applicableFor: true,
        validTill: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return coupons.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue:
        c.discountType === "FLAT" ? Number(c.discountValue) / 100 : Number(c.discountValue),
      maxDiscountAmount: c.maxDiscountPaise ? c.maxDiscountPaise / 100 : null,
      minOrderAmount: c.minOrderPaise ? c.minOrderPaise / 100 : null,
      scope: c.scope,
      applicableFor: c.applicableFor,
      validTill: c.validTill,
    }));
  },
};
