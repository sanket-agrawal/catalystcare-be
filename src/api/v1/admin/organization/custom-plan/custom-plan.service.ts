import {prisma} from "../../../../../infrastructure/prisma/client";
import ApiError from "../../../../../shared/utils/ApiError";
import { CreateOrgPlanDTO, UpdateOrgPlanDTO } from "./custom-plan.dto";

const CustomPlanService = {
  create: async (adminId: string, data: CreateOrgPlanDTO) => {
    return prisma.orgPlan.create({
      data: {
        ...data,
        createdByAdminId: adminId,
      },
    });
  },

  getAll: async () => {
    return prisma.orgPlan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  },

  getById: async (id: string) => {
    const plan = await prisma.orgPlan.findUnique({ where: { id } });

    if (!plan) {
      throw new ApiError(404, "Org plan not found");
    }

    return plan;
  },

  update: async (id: string, data: UpdateOrgPlanDTO) => {
    const exists = await prisma.orgPlan.findUnique({ where: { id } });

    if (!exists) {
      throw new ApiError(404, "Org plan not found");
    }

    return prisma.orgPlan.update({
      where: { id },
      data,
    });
  },

  delete: async (id: string) => {
    const exists = await prisma.orgPlan.findUnique({ where: { id } });

    if (!exists) {
      throw new ApiError(404, "Org plan not found");
    }

    // Soft delete (recommended)
    return prisma.orgPlan.update({
      where: { id },
      data: { isActive: false },
    });
  },
};

export default CustomPlanService;