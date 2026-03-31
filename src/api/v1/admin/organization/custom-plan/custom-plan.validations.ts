import { z } from "zod";

export const createOrgPlanSchema = z.object({
  name: z.string().min(1),
  type: z.enum([" CORPORATE", "SCHOOL","COLLEGE"]), // adjust as per enum
  sessionsCount: z.number().int().positive(),
  maxMembers: z.number().int().positive(),
  sessionDuration: z.number().int().positive(),
  pricePaise: z.number().int().nonnegative(),
  currency: z.string().default("INR"),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]), // adjust
  features: z.any().optional(),
  description: z.string().optional(),
  highlightedText: z.string().optional(),
  isVisible: z.boolean().optional(),
  isCustom: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateOrgPlanSchema = createOrgPlanSchema.partial();