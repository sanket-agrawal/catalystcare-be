import { emailQueue } from "../../../../../infrastructure/queues";
import {prisma} from "../../../../../infrastructure/prisma/client";
import ApiError from "../../../../../shared/utils/ApiError";
import { CreateCustomPlanDTO, createPaymentLinkDTO, UpdateCustomPlanDTO } from "./custom-plan.dto";
import { emailFromAddress, organizationOnboardingSubjects } from "../../../../../shared/config/email.config";
import { customPlanPaymentLinkTemplate } from "../../../../../shared/email-templates/organizations/custom-plan";

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

  // ✅ Update DB
  const updatedPlan = await prisma.customPlanRequest.update({
    where: { orgId },
    data: {
      status: "PAYMENT_LINK_SENT",
      paymentLink: data.paymentLink,
    },
  });

  // ✅ Send Email with full plan details
  await emailQueue.add("sendPaymentLinkEmail", {
    to: plan.org.contactEmail,
    subject: organizationOnboardingSubjects(plan.org.name).planCreated,
    html: customPlanPaymentLinkTemplate({
      firstName: plan.org.contactName,
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

  return updatedPlan;
},

  recordPayment: async (orgId: string) => {
    const plan = await prisma.customPlanRequest.findUnique({
      where: { orgId },
    });

    if (!plan) throw new ApiError(404, "Custom plan not found");

    if (plan.status !== "PAYMENT_LINK_SENT") {
      throw new ApiError(400, "Payment link not sent yet");
    }

    return prisma.customPlanRequest.update({
      where: { orgId },
      data: {
        status: "PLAN_CREATED",
      },
    });
  },
};

export default CustomPlanService;