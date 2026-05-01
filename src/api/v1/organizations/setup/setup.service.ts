import ApiError from "../../../../shared/utils/ApiError";
import { AcceptOrgInviteDTO, OrgSetupDTO } from "./setup.dto";
import { prisma } from "../../../../infrastructure/prisma/client";
import {randomUUID} from "crypto";
import { addDays } from "date-fns";
import { emailQueue } from "../../../../infrastructure/queues/index";
import { emailFromAddress, organizationOnboardingSubjects } from "../../../../shared/config/email.config";
import { orgAdminInviteTemplate } from "../../../../shared/email-templates/organizations/setup";
import bcrypt from "bcryptjs";


const SetupService = {
   validateSetupToken: async (token: string) => {
  const org = await prisma.organization.findUnique({
    where: { setupToken: token },
    select: {
      id: true,
      name: true,
      setupToken: true,
      setupTokenExpiresAt: true,
      setupCompletedAt: true,
    },
  });

  if (!org) throw new ApiError(404, "Invalid setup link");
  if (org.setupCompletedAt) throw new ApiError(400, "Organization setup is already complete");
  if (!org.setupTokenExpiresAt || org.setupTokenExpiresAt < new Date()) {
    throw new ApiError(400, "This setup link has expired. Please contact support.");
  }

  return { orgId: org.id, orgName: org.name };
},
submitOrgAdminEmail: async (token: string, data: OrgSetupDTO) => {
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

  const existingUser = await prisma.user.findUnique({
    where: { email: data.adminEmail },
    select: { id: true },
  });
  
  if (existingUser) {
    throw new ApiError(400, "A user with this email already exists");
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

  // Check if a user with this email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
  });

  if (existingUser) {
    // Edge case: user registered via another flow (e.g. Google SSO)
    // You can either throw, or just add them as a member directly
    throw new ApiError(400, "An account with this email already exists.");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const [newUser] = await prisma.$transaction([
    // 1. Create the user
    prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: invite.email,       // locked to invited email
        password: hashedPassword,
        role: "ORG_ADMIN",            // base role; org role is in OrgMember
        isEmailVerified: true,     // trusted since they received the invite email
      },
    }),
  ]);

  // Need newUser.id for subsequent creates, so run rest separately
  // or use interactive transactions
  await prisma.$transaction(async (tx) => {
    // 2. Create OrgMember
    await tx.orgMember.create({
      data: {
        orgId: invite.orgId,
        userId: newUser.id,
        role: invite.role,         // ORG_ADMIN
        status: "ACTIVE",
      },
    });

    // 3. Mark invite accepted
    await tx.orgInvitation.update({
      where: { token: data.token },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    // 4. Mark org setup complete
    await tx.organization.update({
      where: { id: invite.orgId },
      data: {
        setupCompletedAt: new Date(),
        setupToken: null,
        setupTokenExpiresAt: null,
      },
    });
  });

  return {
    orgId: invite.orgId,
    orgName: invite.org.name,
    role: invite.role,
    email: invite.email,
  };
},
}

export default SetupService;