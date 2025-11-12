import {z} from "zod";

export enum TherapistProfileStatus {
  APPROVED = "APPROVED",
  PENDING = "PENDING",
  REJECTED = "REJECTED"
}

export const createCommissionRateSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .trim(),

  // Accepts either string or number (Prisma Decimal friendly)
  platformPercent: z.coerce
    .number()
    .positive({ message: "Platform percent must be positive" }),

  gatewayPercent: z.coerce
    .number()
    .min(0, { message: "Gateway percent cannot be negative" }),

  effectiveFrom: z
    .string()
    .datetime({ message: "Invalid effectiveFrom datetime format" })
    .optional(),

  effectiveTo: z
    .string()
    .datetime({ message: "Invalid effectiveTo datetime format" })
    .nullable()
    .optional(),
});

export type CreateCommissionRateInput = z.infer<typeof createCommissionRateSchema>;
