import { z } from "zod";
import { OrgMemberRole } from "@prisma/client";

// ─── Single Invite ─────────────────────────────────────────────────────────────

export const InviteMemberSchema = z.object({
  body: z.object({
    emails: z
      .array(
        z.string().email("Each entry must be a valid email address").toLowerCase().trim()
      )
      .min(1, "At least one email is required")
      .max(50, "Cannot invite more than 50 members at once"),

    role: z
      .nativeEnum(OrgMemberRole, {
        errorMap: () => ({
          message: `Role must be one of: ${Object.values(OrgMemberRole).join(", ")}`,
        }),
      })
      .default(OrgMemberRole.EMPLOYEE),

    department: z.string().trim().max(100).optional(),

    expiresInDays: z
      .number()
      .int()
      .min(1, "Expiry must be at least 1 day")
      .max(30, "Expiry cannot exceed 30 days")
      .default(7),
  }),

  params: z.object({
    orgId: z.string().uuid("Invalid organization ID"),
  }),
});

export type InviteMemberDto = z.infer<typeof InviteMemberSchema>["body"];

// ─── Bulk Invite via CSV ────────────────────────────────────────────────────────

/**
 * Each row parsed from CSV must conform to this shape.
 * The CSV is expected to have headers: email, role (optional), department (optional)
 */
export const CSVRowSchema = z.object({
  email: z
    .string({ required_error: "Email is required in CSV row" })
    .email("Invalid email in CSV row")
    .toLowerCase()
    .trim(),

  role: z
    .nativeEnum(OrgMemberRole)
    .default(OrgMemberRole.EMPLOYEE)
    .optional(),

  department: z.string().trim().max(100).optional(),
});

export type CSVRowDto = z.infer<typeof CSVRowSchema>;

export const BulkInviteCSVParamsSchema = z.object({
  params: z.object({
    orgId: z.string().uuid("Invalid organization ID"),
  }),
  // file itself is validated at middleware level (multer)
  // optional override for role/expiry applied to ALL rows
  body: z.object({
    defaultRole: z
      .nativeEnum(OrgMemberRole)
      .default(OrgMemberRole.EMPLOYEE)
      .optional(),

    expiresInDays: z
      .number()
      .int()
      .min(1)
      .max(30)
      .default(7)
      .optional(),
  }),
});

export type BulkInviteCSVParamsDto = z.infer<typeof BulkInviteCSVParamsSchema>["body"];

// ─── Result shape returned to client ───────────────────────────────────────────

export interface InviteResult {
  invited: string[];       // emails successfully queued
  skipped: string[];       // already members / already have pending invite
  failed: string[];        // invalid / other errors
}

export interface BulkInviteResult extends InviteResult {
  totalRowsProcessed: number;
  parseErrors: { row: number; message: string }[];
}