import { z } from "zod";

// ── Enums matching Prisma schema ──
const SessionTypeEnum = z.enum(["INDIVIDUAL", "COUPLE"]);
const RiskLevelEnum = z.enum(["NONE", "LOW", "MODERATE", "HIGH", "CRITICAL"]);

// ── Create Session Note ──
export const createSessionNoteSchema = z.object({
  bookingId: z.string().uuid("bookingId must be a valid UUID"),

  sessionType: SessionTypeEnum.optional().default("INDIVIDUAL"),

  moodBefore: z
    .number()
    .int("moodBefore must be an integer")
    .min(1, "moodBefore must be between 1 and 10")
    .max(10, "moodBefore must be between 1 and 10")
    .optional()
    .nullable(),

  moodAfter: z
    .number()
    .int("moodAfter must be an integer")
    .min(1, "moodAfter must be between 1 and 10")
    .max(10, "moodAfter must be between 1 and 10")
    .optional()
    .nullable(),

  presentingConcerns: z
    .string()
    .max(5000, "presentingConcerns must not exceed 5000 characters")
    .optional()
    .nullable(),

  sessionSummary: z
    .string()
    .min(1, "sessionSummary is required")
    .max(10000, "sessionSummary must not exceed 10000 characters"),

  interventionsUsed: z
    .array(z.string().min(1).max(200))
    .max(20, "Maximum 20 interventions allowed")
    .optional()
    .default([]),

  keyObservations: z
    .string()
    .max(5000, "keyObservations must not exceed 5000 characters")
    .optional()
    .nullable(),

  progressNotes: z
    .string()
    .max(5000, "progressNotes must not exceed 5000 characters")
    .optional()
    .nullable(),

  riskAssessment: RiskLevelEnum.optional().nullable(),

  nextSessionGoals: z
    .string()
    .max(3000, "nextSessionGoals must not exceed 3000 characters")
    .optional()
    .nullable(),

});

// ── Update Session Note (all optional) ──
export const updateSessionNoteSchema = z
  .object({
    sessionType: SessionTypeEnum.optional(),

    moodBefore: z
      .number()
      .int("moodBefore must be an integer")
      .min(1, "moodBefore must be between 1 and 10")
      .max(10, "moodBefore must be between 1 and 10")
      .optional()
      .nullable(),

    moodAfter: z
      .number()
      .int("moodAfter must be an integer")
      .min(1, "moodAfter must be between 1 and 10")
      .max(10, "moodAfter must be between 1 and 10")
      .optional()
      .nullable(),

    presentingConcerns: z
      .string()
      .max(5000, "presentingConcerns must not exceed 5000 characters")
      .optional()
      .nullable(),

    sessionSummary: z
      .string()
      .min(1, "sessionSummary is required")
      .max(10000, "sessionSummary must not exceed 10000 characters")
      .optional(),

    interventionsUsed: z
      .array(z.string().min(1).max(200))
      .max(20, "Maximum 20 interventions allowed")
      .optional(),

    keyObservations: z
      .string()
      .max(5000, "keyObservations must not exceed 5000 characters")
      .optional()
      .nullable(),

    progressNotes: z
      .string()
      .max(5000, "progressNotes must not exceed 5000 characters")
      .optional()
      .nullable(),

    riskAssessment: RiskLevelEnum.optional().nullable(),

    nextSessionGoals: z
      .string()
      .max(3000, "nextSessionGoals must not exceed 3000 characters")
      .optional()
      .nullable(),

  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// ── Inferred types ──
export type CreateSessionNoteDTO = z.infer<typeof createSessionNoteSchema>;
export type UpdateSessionNoteDTO = z.infer<typeof updateSessionNoteSchema>;
