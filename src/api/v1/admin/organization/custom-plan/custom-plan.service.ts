import { emailQueue } from "../../../../../infrastructure/queues";
import {prisma} from "../../../../../infrastructure/prisma/client";
import ApiError from "../../../../../shared/utils/ApiError";
import { BillingCycle, ConfirmOrgPaymentDTO, CreateCustomPlanDTO, createPaymentLinkDTO, UpdateCustomPlanDTO } from "./custom-plan.dto";
import { emailFromAddress, organizationOnboardingSubjects } from "../../../../../shared/config/email.config";
import { customPlanPaymentLinkTemplate, orgActivationTemplate } from "../../../../../shared/email-templates/organizations/custom-plan";

import { addMonths, addYears, addDays } from "date-fns";
import { randomUUID } from "crypto";

export const calculateValidTill = (from: Date, billingCycle: BillingCycle): Date => {
  switch (billingCycle) {
    case "MONTHLY":      return addMonths(from, 1);
    case "QUARTERLY":    return addMonths(from, 3);
    case "SEMI_ANNUAL":  return addMonths(from, 6);
    case "ANNUAL":       return addYears(from, 1);
    case "PER_SEMESTER": return addMonths(from, 6);
    case "CUSTOM":       return addYears(from, 1);
    default:             return addYears(from, 1);
  }
};

const CustomPlanService = {
  create: async (adminId: string, data: CreateCustomPlanDTO) => {
    const existing = await prisma.customPlanRequest.findUnique({
      where: { orgId: data.orgId },
    });

    if (existing) {
      throw new ApiError(400, "Custom plan already exists for this org");
    }

    const plan =  prisma.customPlanRequest.create({
      data: {
        ...data,
        assignedAdminId: adminId,
        pricePaise : data.price * 100
      },
    });

    await prisma.organization.update({
      where : {id : data.orgId},
      data : {
        status : "PLAN_CREATED"
      }
    });

    return plan;
  },

  getByOrgId: async (orgId: string) => {
    const plan = await prisma.customPlanRequest.findUnique({
      where: { orgId },
      include: { org: true, assignedAdmin: true },
    });

    if (!plan) throw new ApiError(404, "Custom plan not found");

    return plan;
  },

  update: async (orgId: string, data: UpdateCustomPlanDTO) => {
    const exists = await prisma.customPlanRequest.findUnique({
      where: { orgId },
    });

    if (!exists) throw new ApiError(404, "Custom plan not found");

    if(data.status == "IN_DISCUSSION" && exists.status != "PAYMENT_LINK_SENT"){
      throw new ApiError(400, "Cannot update plan status before payment link is sent");
    }

    if(data.price && exists.status == "PAYMENT_LINK_SENT"){
      throw new ApiError(400, "Cannot update plan after payment link is sent");
    }

   return prisma.customPlanRequest.update({
  where: { orgId },
  data: {
    ...data,
    ...(data.price !== undefined && {
      pricePaise: data.price * 100,
    }),
  },
});
  },

  sendPaymentLink: async (orgId: string, data: createPaymentLinkDTO) => {
  const plan = await prisma.customPlanRequest.findUnique({
    where: { orgId },
    include: {
      org: true,
    },
  });

  if (!plan) throw new ApiError(404, "Custom plan not found");

  if (plan.status !== "IN_DISCUSSION") {
    throw new ApiError(400, "Plan must be in discussion before payment");
  }

  if (!data.paymentLink) {
    throw new ApiError(400, "Payment link is required");
  }

  const accountTeamEmail =
    data.orgAccountTeamContactEmail ?? plan.org.orgAccountTeamContactEmail;

  const accountTeamName =
    data.orgAccountTeamContactName ?? plan.org.orgAccountTeamContactName;

  const hasAccountTeam = !!accountTeamEmail && !!accountTeamName;

  const emailTo = hasAccountTeam ? accountTeamEmail! : plan.org.contactEmail;
  const emailCc = hasAccountTeam ? plan.org.contactEmail : undefined;
  const recipientFirstName = hasAccountTeam
    ? accountTeamName!
    : plan.org.contactName;

      await prisma.$transaction([

      prisma.customPlanRequest.update({
    where: { orgId },
    data: {
      status: "PAYMENT_LINK_SENT",
      paymentLink: data.paymentLink,
    },
  }),

      prisma.organization.update({
      where: { id: orgId },
      data: {
        status: "PAYMENT_LINK_SENT",
        // update account team details if freshly provided
        ...(data.orgAccountTeamContactName && {
          orgAccountTeamContactName: data.orgAccountTeamContactName,
        }),
        ...(data.orgAccountTeamContactEmail && {
          orgAccountTeamContactEmail: data.orgAccountTeamContactEmail,
        }),
      },
    }),
      ])

  // ✅ Update DB


  // ✅ Send Email with full plan details
  await emailQueue.add("sendPaymentLinkEmail", {
    to: emailTo,
    cc: emailCc,
    subject: organizationOnboardingSubjects(plan.org.name).planCreated,
    html: customPlanPaymentLinkTemplate({
      firstName: recipientFirstName,
      paymentLink: data.paymentLink,

      sessionsCount: plan.sessionsCount,
      maxMembers: plan.maxMembers,
      sessionDuration: plan.sessionDuration,
      pricePaise: plan.pricePaise,
      billingCycle: plan.billingCycle,
      currency: plan.currency,
    }),
    sender: emailFromAddress().onboarding,
  });

    const updatedPlan = await prisma.customPlanRequest.findUnique({
      where: { orgId },
    });


  return updatedPlan;
},

  recordPayment: async (orgId: string, data: ConfirmOrgPaymentDTO, adminId: string) => {
  const plan = await prisma.customPlanRequest.findUnique({
    where: { orgId },
    include: { org: true },
  });

  if (!plan) throw new ApiError(404, "Custom plan not found");
  if (plan.status !== "PAYMENT_LINK_SENT") {
    throw new ApiError(400, "Payment link must be sent before confirming payment");
  }

  const now = new Date();
  const validFrom = now;
  const validTill = calculateValidTill(now, plan.billingCycle);
  const invoiceNumber = data.invoiceNumber;
  const setupToken = randomUUID();

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create OrgSubscription — snapshot everything from plan
    const subscription = await tx.orgSubscription.create({
      data: {
        orgId,
        planName: plan.org.name,
        planType: plan.org.type,
        totalSessions: plan.sessionsCount,
        usedSessions: 0,
        maxMembers: plan.maxMembers,
        pricePaise: plan.pricePaise,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        features: plan.features ?? undefined,
        status: "ACTIVE",
        validFrom,
        validTill,
        autoRenew: false,
        sessionAllocPolicy: "POOL",
        customPlanRequestId: plan.id,
      },
    });

    // 2. Create OrgPayment linked to subscription
    const payment = await tx.orgPayment.create({
      data: {
        orgSubscriptionId: subscription.id,
        amountPaise: plan.pricePaise,
        currency: plan.currency,
        status: "CAPTURED",
        offlineReference: data.offlineReference,
        offlineNote: data.offlineNote ?? null,
        markedPaidByAdminId: adminId,
        markedPaidAt: now,
        capturedAt: now,
        invoiceNumber,
      },
    });

    // 3. Update CustomPlanRequest
    await tx.customPlanRequest.update({
      where: { orgId },
      data: { status: "PLAN_CREATED" },
    });


    // 4. Activate Organization
    await tx.organization.update({
      where: { id: orgId },
      data: { status: "ACTIVE", 
        setupToken,
    setupTokenExpiresAt: addDays(now, 7), },
    });

    return { subscription, payment };
  });

  // 5. Send activation email after transaction
  await emailQueue.add("sendOrgActivationEmail", {
    to: plan.org.contactEmail,
    subject: organizationOnboardingSubjects(plan.org.name).activated,
    html: orgActivationTemplate({
  firstName: plan.org.contactName,
  orgName: plan.org.name,
  sessionsCount: plan.sessionsCount,
  maxMembers: plan.maxMembers,
  sessionDuration: plan.sessionDuration,   // add this
  pricePaise: plan.pricePaise,             // add this
  billingCycle: plan.billingCycle,         // add this
  currency: plan.currency,                 // add this
  validFrom,
  validTill,
  invoiceNumber,
  setupToken
}),
    sender: emailFromAddress().onboarding,
  });

  return result;
},
};

export default CustomPlanService;