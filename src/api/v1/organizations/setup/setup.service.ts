import ApiError from "../../../../shared/utils/ApiError";
import { AcceptOrgInviteDTO, OrgSetupDTO } from "./setup.dto";
import { prisma } from "../../../../infrastructure/prisma/client";
import {randomUUID} from "crypto";
import { addDays } from "date-fns";
import { emailQueue } from "../../../../infrastructure/queues/index";
import { emailFromAddress, organizationOnboardingSubjects } from "../../../../shared/config/email.config";
import { orgAdminInviteTemplate } from "../../../../shared/email-templates/organizations/custom-plan";


const SetupService = {
submitOrgAdminEmail: async (token: string, data: OrgSetupDTO, adminId: string) => {
  const org = await prisma.organization.findUnique({
    where: { setupToken: token },
  });

  if (!org) throw new ApiError(404, "Invalid setup link");
  if (org.setupCompletedAt) throw new ApiError(400, "Organization setup is already complete");
  if (!org.setupTokenExpiresAt || org.setupTokenExpiresAt < new Date()) {
    throw new ApiError(400, "This setup link has expired. Please contact support.");
  }

  // Check if invite already sent to this email for this org
  const existingInvite = await prisma.orgInvitation.findUnique({
    where: { orgId_email: { orgId: org.id, email: data.adminEmail } },
  });

  if (existingInvite && existingInvite.status === "PENDING") {
    throw new ApiError(400, "An invite has already been sent to this email");
  }

  const inviteToken = randomUUID();
  const expiresAt = addDays(new Date(), 7);

  await prisma.orgInvitation.create({
    data: {
      orgId: org.id,
      email: data.adminEmail,
      role: "ORG_ADMIN",
      token: inviteToken,
      expiresAt,
      status: "PENDING",
      invitedByUserId: adminId, // the platform admin who confirmed payment
    },
  });

  // Send invite email
  await emailQueue.add("sendOrgAdminInviteEmail", {
    to: data.adminEmail,
    subject: organizationOnboardingSubjects(org.name).adminInvite,
    html: orgAdminInviteTemplate({
      orgName: org.name,
      inviteToken,
    }),
    sender: emailFromAddress().onboarding,
  });

  return { message: "Invite sent successfully" };
},
validateInviteToken: async (token: string) => {
  const invite = await prisma.orgInvitation.findUnique({
    where: { token },
    include: { org: true },
  });

  if (!invite) throw new ApiError(404, "Invalid invite link");
  if (invite.status === "ACCEPTED") throw new ApiError(400, "This invite has already been accepted");
  if (invite.status === "REVOKED") throw new ApiError(400, "This invite has been revoked");
  if (invite.expiresAt < new Date()) throw new ApiError(400, "This invite link has expired");

  // Let frontend know if user already exists — so it shows login vs signup
  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
    select: { id: true },
  });

  return {
    email: invite.email,
    orgName: invite.org.name,
    role: invite.role,
    userExists: !!existingUser,
  };
},
acceptOrgInvite: async (data: AcceptOrgInviteDTO) => {
  const invite = await prisma.orgInvitation.findUnique({
    where: { token: data.token },
    include: { org: true },
  });

  if (!invite) throw new ApiError(404, "Invalid invite link");
  if (invite.status === "ACCEPTED") throw new ApiError(400, "Invite already accepted");
  if (invite.status === "REVOKED") throw new ApiError(400, "This invite has been revoked");
  if (invite.expiresAt < new Date()) throw new ApiError(400, "This invite link has expired");

  // Check member doesn't already exist
  const existingMember = await prisma.orgMember.findUnique({
    where: { orgId_userId: { orgId: invite.orgId, userId: data.userId } },
  });

  if (existingMember) throw new ApiError(400, "User is already a member of this organization");

  await prisma.$transaction([
    // 1. Create OrgMember
    prisma.orgMember.create({
      data: {
        orgId: invite.orgId,
        userId: data.userId,
        role: invite.role,
        status: "ACTIVE",
      },
    }),

    // 2. Mark invite accepted
    prisma.orgInvitation.update({
      where: { token: data.token },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    }),

    // 3. Mark org setup complete
    prisma.organization.update({
      where: { id: invite.orgId },
      data: {
        setupCompletedAt: new Date(),
        setupToken: null,          // invalidate token after use
        setupTokenExpiresAt: null,
      },
    }),
  ]);

  return {
    orgId: invite.orgId,
    orgName: invite.org.name,
    role: invite.role,
  };
},
}

export default SetupService;