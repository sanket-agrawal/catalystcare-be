import { z } from "zod";

// export const emailBlastSchema = z.object({
//   target: z.enum(["ALL_USERS", "ALL_THERAPISTS", "CSV", "SINGLE_EMAIL"], {
//     required_error: "target is required",
//   }),

//   subject: z
//     .string({ required_error: "subject is required" })
//     .min(1, "subject cannot be empty"),

//   content: z
//     .string({ required_error: "content is required" })
//     .min(1, "content cannot be empty"),

//   reason: z
//     .string({ required_error: "reason is required" })
//     .min(1, "reason cannot be empty"),

//   // only required for SINGLE_EMAIL
//   singleEmail: z
//     .string()
//     .email("Invalid email format")
//     .optional(),
// });
