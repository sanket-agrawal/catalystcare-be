import { z } from "zod";

const answerSchema = z
  .object({
    questionId: z.string().min(1, "questionId is required"),
    // New preferred shape (client sends the weight directly)
    optionWeight: z.number().int().min(0).max(100),
    // Legacy support (client sends optionId)
    optionId: z.string().min(1).optional()
  })
  .passthrough()
  .refine(
    (a) => typeof a.optionWeight === "number" || typeof a.optionId === "string",
    "Each answer must include optionWeight or optionId"
  );

export const submitAssessmentSchema = z.object({
  slug: z.string().min(1, "slug is required"),
  email: z.string().email("Invalid email address"),
  name: z.string().min(1).max(120).optional(),
  answers: z.array(answerSchema).min(1, "answers are required")
});

export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>;

