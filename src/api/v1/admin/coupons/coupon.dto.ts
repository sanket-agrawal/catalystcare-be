import { z } from "zod";
import { CouponScope, CouponStatus, CouponApplicableFor, DiscountType } from "@prisma/client";

export const createCouponSchema = z
  .object({
    code: z
      .string()
      .min(3, "Coupon code must be at least 3 characters")
      .max(30, "Coupon code cannot exceed 30 characters")
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Code must contain only alphanumeric characters, underscores, or hyphens"
      )
      .trim(),
    description: z.string().max(255).optional(),

    discountType: z.nativeEnum(DiscountType),
    discountValue: z.number().positive("Discount value must be positive"),
    maxDiscountAmount: z
      .number()
      .positive("Max discount amount must be positive")
      .optional()
      .nullable(),
    minOrderAmount: z.number().min(0, "Min order amount cannot be negative").optional().nullable(),

    scope: z.nativeEnum(CouponScope).default(CouponScope.ALL),
    applicableFor: z.nativeEnum(CouponApplicableFor).default(CouponApplicableFor.ALL),

    allowedClientIds: z.array(z.string().uuid("Invalid client ID format")).optional(),
    allowedTherapistIds: z.array(z.string().uuid("Invalid therapist ID format")).optional(),
    allowedCategoryIds: z.array(z.string().uuid("Invalid category ID format")).optional(),

    maxUsageTotal: z
      .number()
      .int()
      .positive("Max total usage must be a positive integer")
      .optional()
      .nullable(),
    maxUsagePerUser: z
      .number()
      .int()
      .positive("Max usage per user must be a positive integer")
      .default(1),

    validFrom: z.string().datetime("Invalid validFrom datetime format").optional(),
    validTill: z.string().datetime("Invalid validTill datetime format").optional().nullable(),
    isVisibleOnWebsite: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.discountType === DiscountType.PERCENTAGE && data.discountValue > 100) {
        return false;
      }
      return true;
    },
    { message: "Percentage discount cannot exceed 100%", path: ["discountValue"] }
  );

export type CreateCouponInput = z.infer<typeof createCouponSchema>;

export const updateCouponSchema = z.object({
  description: z.string().max(255).optional(),
  status: z.nativeEnum(CouponStatus).optional(),
  isVisibleOnWebsite: z.boolean().optional(),
  maxDiscountAmount: z.number().positive().optional().nullable(),
  minOrderAmount: z.number().min(0).optional().nullable(),
  maxUsageTotal: z.number().int().positive().optional().nullable(),
  maxUsagePerUser: z.number().int().positive().optional(),
  validFrom: z.string().datetime().optional(),
  validTill: z.string().datetime().optional().nullable(),
  allowedClientIds: z.array(z.string().uuid()).optional(),
  allowedTherapistIds: z.array(z.string().uuid()).optional(),
  allowedCategoryIds: z.array(z.string().uuid()).optional(),
});

export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
