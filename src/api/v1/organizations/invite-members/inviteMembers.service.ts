import { OrgMemberRole, OrgInvitationStatus, Prisma } from "@prisma/client";
import crypto from "crypto";
import { parse as csvParse } from "csv-parse/sync";
import prisma from "../../../../shared/lib/prisma"; // adjust to your prisma client path
import ApiError from "../../../../shared/utils/ApiError";
import {
  InviteMemberDto,
  CSVRowSchema,
  CSVRowDto,
  InviteResult,
  BulkInviteResult,
} from "../inviteMembers.validation";

// ─── Constants ─────────────────────────────────────────────────────────────────

const INVITE_EXPIRY_DAYS_DEFAULT = 7;
const MAX_CSV_ROWS = 500;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function computeExpiry(daysFromNow: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

/**
 * For each email in the list, determine which ones:
 *  - are already active members of the org           → skip
 *  - already have a PENDING (non-expired) invitation  → skip
 *  - are safe to invite                               → proceed
 */
async function partitionEmails(
  orgId: string,
  emails: string[]
): Promise<{ toInvite: string[]; skipped: string[] }> {
  // 1. Find users that are already members
  const existingMembers = await prisma.orgMember.findMany({
    where: {
      orgId,
      user: { email: { in: emails } },
      status: "ACTIVE",
    },
    include: { user: { select: { email: true } } },
  });
  const memberEmails = new Set(existingMembers.map((m) => m.user.email));

  // 2. Find emails that already have an active pending invite
  const pendingInvites = await prisma.orgInvitation.findMany({
    where: {
      orgId,
      email: { in: emails },
      status: OrgInvitationStatus.PENDING,
      expiresAt: { gt: new Date() },
    },
    select: { email: true },
  });
  const pendingEmails = new Set(pendingInvites.map((i) => i.email));

  const toInvite: string[] = [];
  const skipped: string[] = [];

  for (const email of emails) {
    if (memberEmails.has(email) || pendingEmails.has(email)) {
      skipped.push(email);
    } else {
      toInvite.push(email);
    }
  }

  return { toInvite, skipped };
}

/**
 * Core invite creation — upserts invitation rows inside a transaction.
 * If an EXPIRED / REVOKED invite already exists for the same (orgId, email)
 * pair, it is replaced (Prisma upsert on the unique constraint).
 */
async function createInvitations(
  orgId: string,
  emails: string[],
  role: OrgMemberRole,
  expiresAt: Date,
  invitedByUserId: string
): Promise<void> {
  await prisma.$transaction(
    emails.map((email) =>
      prisma.orgInvitation.upsert({
        where: { orgId_email: { orgId, email } },
        create: {
          orgId,
          email,
          role,
          token: generateInviteToken(),
          expiresAt,
          status: OrgInvitationStatus.PENDING,
          invitedByUserId,
        },
        update: {
          // Re-invite: refresh token, expiry, status, role
          role,
          token: generateInviteToken(),
          expiresAt,
          status: OrgInvitationStatus.PENDING,
          invitedByUserId,
          acceptedAt: null,
        },
      })
    )
  );
}

// ─── Service ───────────────────────────────────────────────────────────────────

const InviteMemberService = {

  /**
   * Invite one or more members by email list.
   * Called from the single-invite controller action.
   */
  inviteMembers: async (
    orgId: string,
    invitedByUserId: string,
    dto: InviteMemberDto
  ): Promise<InviteResult> => {
    // 1. Verify org exists and is active
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new ApiError(404, "Organization not found");

    const blockedStatuses = ["SUSPENDED", "EXPIRED"];
    if (blockedStatuses.includes(org.status)) {
      throw new ApiError(403, `Cannot invite members — organization is ${org.status.toLowerCase()}`);
    }

    // 2. Check active subscription seat limit (POOL policy)
    const activeSub = await prisma.orgSubscription.findFirst({
      where: { orgId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (activeSub) {
      const currentMemberCount = await prisma.orgMember.count({
        where: { orgId, status: "ACTIVE" },
      });
      const remainingSeats = activeSub.maxMembers - currentMemberCount;
      const uniqueEmails = [...new Set(dto.emails)];

      // We only block if ALL requested would exceed; individual skips handled below
      if (remainingSeats <= 0) {
        throw new ApiError(
          403,
          `Seat limit reached. Your plan allows ${activeSub.maxMembers} members.`
        );
      }
    }

    // 3. De-duplicate input
    const uniqueEmails = [...new Set(dto.emails)];

    // 4. Partition
    const { toInvite, skipped } = await partitionEmails(orgId, uniqueEmails);

    const failed: string[] = [];
    const invited: string[] = [];

    if (toInvite.length === 0) {
      return { invited, skipped, failed };
    }

    // 5. Create invitations
    const expiresAt = computeExpiry(dto.expiresInDays ?? INVITE_EXPIRY_DAYS_DEFAULT);

    try {
      await createInvitations(orgId, toInvite, dto.role, expiresAt, invitedByUserId);
      invited.push(...toInvite);
    } catch (err) {
      // Fall back to per-email creation so partial success is possible
      for (const email of toInvite) {
        try {
          await createInvitations(orgId, [email], dto.role, expiresAt, invitedByUserId);
          invited.push(email);
        } catch {
          failed.push(email);
        }
      }
    }

    // 6. TODO: Dispatch invitation emails (queue job per `invited`)
    // e.g. await emailQueue.addBulk(invited.map(email => ({ email, token, orgName: org.name })));

    return { invited, skipped, failed };
  },

  // ─── Bulk CSV Invite ──────────────────────────────────────────────────────────

  /**
   * Parse a CSV file buffer and create invitations for each valid row.
   * Expected CSV columns: email (required), role (optional), department (optional)
   */
  bulkInviteMembersWithCSV: async (
    orgId: string,
    invitedByUserId: string,
    fileBuffer: Buffer,
    options: {
      defaultRole?: OrgMemberRole;
      expiresInDays?: number;
    } = {}
  ): Promise<BulkInviteResult> => {
    // 1. Org guard (same as above)
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new ApiError(404, "Organization not found");

    const blockedStatuses = ["SUSPENDED", "EXPIRED"];
    if (blockedStatuses.includes(org.status)) {
      throw new ApiError(403, `Cannot invite members — organization is ${org.status.toLowerCase()}`);
    }

    // 2. Parse CSV
    let rawRows: Record<string, string>[];
    try {
      rawRows = csvParse(fileBuffer, {
        columns: true,           // first row = headers
        skip_empty_lines: true,
        trim: true,
        bom: true,               // handle Excel-exported BOM
      });
    } catch {
      throw new ApiError(400, "Failed to parse CSV file. Ensure it is valid UTF-8 with headers: email, role, department");
    }

    if (rawRows.length === 0) throw new ApiError(400, "CSV file is empty");
    if (rawRows.length > MAX_CSV_ROWS) {
      throw new ApiError(400, `CSV cannot exceed ${MAX_CSV_ROWS} rows per upload`);
    }

    // 3. Validate each row
    const parseErrors: { row: number; message: string }[] = [];
    const validRows: CSVRowDto[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const raw = rawRows[i];
      const result = CSVRowSchema.safeParse({
        email: raw["email"] ?? raw["Email"] ?? raw["EMAIL"],
        role: raw["role"] ?? raw["Role"] ?? raw["ROLE"] ?? options.defaultRole,
        department: raw["department"] ?? raw["Department"] ?? undefined,
      });

      if (!result.success) {
        parseErrors.push({
          row: i + 2, // +2: 1-indexed + header row
          message: result.error.errors.map((e) => e.message).join("; "),
        });
      } else {
        validRows.push(result.data);
      }
    }

    const invited: string[] = [];
    const skipped: string[] = [];
    const failed: string[] = [];

    if (validRows.length === 0) {
      return {
        invited,
        skipped,
        failed,
        totalRowsProcessed: rawRows.length,
        parseErrors,
      };
    }

    // 4. De-duplicate by email (last row wins for role/department)
    const emailMap = new Map<string, CSVRowDto>();
    for (const row of validRows) {
      emailMap.set(row.email, row);
    }
    const uniqueRows = Array.from(emailMap.values());

    // 5. Seat-limit check
    const activeSub = await prisma.orgSubscription.findFirst({
      where: { orgId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (activeSub) {
      const currentMemberCount = await prisma.orgMember.count({
        where: { orgId, status: "ACTIVE" },
      });
      if (activeSub.maxMembers - currentMemberCount <= 0) {
        throw new ApiError(403, `Seat limit reached. Your plan allows ${activeSub.maxMembers} members.`);
      }
    }

    // 6. Partition
    const allEmails = uniqueRows.map((r) => r.email);
    const { toInvite, skipped: skippedEmails } = await partitionEmails(orgId, allEmails);
    skipped.push(...skippedEmails);

    // 7. Create invitations — grouped by role so one transaction per role batch
    const expiresAt = computeExpiry(options.expiresInDays ?? INVITE_EXPIRY_DAYS_DEFAULT);

    const roleGroups = new Map<OrgMemberRole, string[]>();
    for (const email of toInvite) {
      const row = emailMap.get(email)!;
      const role = row.role ?? options.defaultRole ?? OrgMemberRole.EMPLOYEE;
      if (!roleGroups.has(role)) roleGroups.set(role, []);
      roleGroups.get(role)!.push(email);
    }

    for (const [role, emails] of roleGroups) {
      try {
        await createInvitations(orgId, emails, role, expiresAt, invitedByUserId);
        invited.push(...emails);
      } catch {
        // Per-email fallback
        for (const email of emails) {
          try {
            await createInvitations(orgId, [email], role, expiresAt, invitedByUserId);
            invited.push(email);
          } catch {
            failed.push(email);
          }
        }
      }
    }

    // 8. TODO: Dispatch bulk invitation emails
    // await emailQueue.addBulk(invited.map(email => ({ email, orgName: org.name })));

    return {
      invited,
      skipped,
      failed,
      totalRowsProcessed: rawRows.length,
      parseErrors,
    };
  },
};

export default InviteMemberService;