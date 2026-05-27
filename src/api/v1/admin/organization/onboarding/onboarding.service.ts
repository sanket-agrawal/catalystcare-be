import { prisma } from "../../../../../infrastructure/prisma/client";
import slugify from "slugify";
import { CreateOrganizationDTO, UpdateOrganizationDTO } from "./onboarding.dto";
import ApiError from "../../../../../shared/utils/ApiError";
import { emailQueue } from "../../../../../infrastructure/queues";
import { orgQueryReceivedTemplate } from "../../../../../shared/email-templates/organizations/onboarding";
import {
  emailFromAddress,
  organizationOnboardingSubjects,
} from "../../../../../shared/config/email.config";

const OnboardingService = {
  fetchOnboardingRequests: async (status?: string) => {
    return await prisma.organization.findMany({
      include: {
        customPlanReq: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  },
  createOrganization: async (data: CreateOrganizationDTO) => {
    const slug = slugify(data.name, { lower: true, strict: true });

    const existingOrg = await prisma.organization.findUnique({
      where: {
        slug,
      },
    });

    if (existingOrg) {
      throw new ApiError(400, "Organization with the same name already exists");
    }

    const org = await prisma.organization.create({
      data: {
        ...data,
        contactPhone: data.contactPhone ?? "",
        type: data.type as any,
        slug,
      },
    });

    await emailQueue.add("organizationOnboardingInitialTemplate", {
      to: data.contactEmail,
      subject: organizationOnboardingSubjects(data.name).onboardingInitiated,
      html: orgQueryReceivedTemplate(data.contactName),
      sender: emailFromAddress().infoEmail,
    });

    return org;
  },
  updateOrganization: async (id: string, data: UpdateOrganizationDTO) => {
    return prisma.organization.update({
      where: { id },
      data: data as any,
    });
  },
};

export default OnboardingService;
