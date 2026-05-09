import { z } from "zod";

export const VentTextSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message too long (max 2000 characters)")
    .transform((s) => s.trim()),
  sessionId: z
    .string()
    .uuid("Invalid session ID format")
    .optional(),
});

export type VentTextInput = z.infer<typeof VentTextSchema>;