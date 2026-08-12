import { z } from "zod";

export const applyCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").trim(),
  purchaseType: z.enum(["SINGLE", "PROGRAM"]).default("SINGLE"),
  slotId: z.string().uuid("Invalid slot ID format").optional(),
  planId: z.string().uuid("Invalid plan ID format").optional(),
  therapistId: z.string().uuid("Invalid therapist ID format").optional(),
});

export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
