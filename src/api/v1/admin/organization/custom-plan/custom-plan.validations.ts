import { z } from "zod";

export const createCustomPlanSchema = z.object({
  body: z.object({
  orgId: z.string().uuid(),
  notes: z.string().optional(),
  sessionsCount: z.number().int().positive(),
  maxMembers: z.number().int().positive(),
  sessionDuration: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  currency: z.string().default("INR"),
  billingCycle: z.enum([
    "MONTHLY",
    "QUARTERLY",
    "SEMI_ANNUAL",
    "ANNUAL",
    "PER_SEMESTER",
    "CUSTOM",
  ]).optional(),
  features: z.any().optional(),
  description: z.string().optional(),
  highlightedText: z.string().optional(),
  status : z.enum(["IN_DISCUSSION"]).optional(),
})
});

export const updateCustomPlanSchema = z.object({
  body: createCustomPlanSchema.shape.body
    .partial()
    .omit({ orgId: true }),
});


export const createPaymentLinkSchema = z.object({
  body : z.object({
  paymentLink : z.string().url().nonempty(),
  orgAccountTeamContactName: z.string().optional(),
  orgAccountTeamContactEmail: z.string().email().optional(),
  })
});


export const recordPaymentSchema = z.object({
  body : z.object({
  invoiceNumber : z.string().nonempty(),
  offlineReference : z.string().nonempty(),
  offlineNote : z.string().optional()
  })
});


