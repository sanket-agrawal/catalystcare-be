import ApiError from "../../../../shared/utils/ApiError";
import {
  CreateProgramInput,
  ProgramCadence,
  ProgramPurchaseWithRelations,
  UpdatePlanInput,
} from "./program.dto";
import { prisma } from "../../../../infrastructure/prisma/client";
import { Prisma } from "@prisma/client";
import { rupeesToPaise } from "../../../../shared/lib/money";
import { FetchProgramPurchasesResponse } from "../../client/programBooking/programBooking.dto";
import { therapistBookingPermission } from "../therapist.service";

const ProgramService = {
  createProgram: async (therapistId: string, input: CreateProgramInput) => {
    if (!input.plans?.length) {
      throw new ApiError(400, "At least one plan is required");
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const therapistProfile = await tx.therapistProfile.findFirst({
        where: {
          id: therapistId,
        },
      });

      if (!therapistProfile) {
        throw new ApiError(404, "Therapist Profile not found");
      }

      if (therapistProfile.status !== "APPROVED") {
        throw new ApiError(404, "Only Approved Therapists can create Programs");
      }

      const program = await tx.program.create({
        data: {
          therapistId: therapistId,
          title: input.title,
          description: input.description,
          outcome: input.outcome,
          plans: {
            create: input.plans.map((plan) => ({
              name: plan.name,
              sessionsCount: plan.sessionsCount,
              sessionDuration: plan.sessionDuration,
              price: plan.price,
              pricePaise: rupeesToPaise(plan.price),
              cadence: plan.cadence,
              recommendedGapDays: plan.recommendedGapDays,
            })),
          },
        },
        include: { plans: true },
      });

      return program;
    });
  },
  fetchAllPrograms: async (therapistId: string) => {
    return prisma.program.findMany({
      where: {
        therapistId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        outcome: true,
        createdAt: true,
        isActive: true,
        plans: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  },
  updateProgram: async (
    programId: string,
    therapistId: string,
    data: {
      title?: string;
      description?: string;
      outcome?: string;
    }
  ) => {
    const program = await prisma.program.findFirst({
      where: { id: programId, therapistId },
    });

    if (!program) {
      throw new ApiError(404, "Program not found");
    }

    if (program.isActive) {
      throw new ApiError(400, "Cannot edit a published program");
    }

    return prisma.program.update({
      where: { id: programId },
      data,
    });
  },
  publishProgram: async (programId: string, therapistId: string) => {
    const program = await prisma.program.findFirst({
      where: { id: programId, therapistId },
      include: { plans: { where: { isActive: true } } },
    });

    if (!program) {
      throw new ApiError(404, "Program not found");
    }

    if (!program.plans.length) {
      throw new ApiError(400, "At least one active plan is required to publish");
    }

    return prisma.program.update({
      where: { id: programId },
      data: { isActive: true },
    });
  },
  unPublishProgram: async (programId: string, therapistId: string) => {
    const program = await prisma.program.findFirst({
      where: { id: programId, therapistId },
    });

    if (!program) {
      throw new ApiError(404, "Program not found");
    }

    if (!program.isActive) {
      throw new ApiError(404, "Program is not active");
    }

    return prisma.program.update({
      where: { id: programId },
      data: { isActive: false },
    });
  },
  addPlanToProgram: async (
    programId: string,
    therapistId: string,
    plan: {
      name: string;
      sessionsCount: number;
      sessionDuration: number;
      price: number;
      cadence: ProgramCadence;
      recommendedGapDays?: number;
    }
  ) => {
    const program = await prisma.program.findFirst({
      where: { id: programId, therapistId },
    });

    if (!program) {
      throw new ApiError(404, "Program not found");
    }

    if (program.isActive) {
      throw new ApiError(400, "Cannot modify plans of a published program");
    }

    return prisma.programPlan.create({
      data: {
        programId,
        name: plan.name,
        sessionsCount: plan.sessionsCount,
        sessionDuration: plan.sessionDuration,
        price: plan.price,
        pricePaise: rupeesToPaise(plan.price),
        cadence: plan.cadence,
        recommendedGapDays: plan.recommendedGapDays,
      },
    });
  },
  publishPlan: async (planId: string, therapistId: string) => {
    const plan = await prisma.programPlan.findFirst({
      where: {
        id: planId,
        program: { therapistId },
      },
    });

    if (!plan) {
      throw new ApiError(404, "Plan not found");
    }

    return prisma.programPlan.update({
      where: { id: planId },
      data: { isActive: true },
    });
  },
  unPublishPlan: async (planId: string, therapistId: string) => {
    const plan = await prisma.programPlan.findFirst({
      where: {
        id: planId,
        program: { therapistId },
      },
    });

    if (!plan) {
      throw new ApiError(404, "Plan not found");
    }

    return prisma.programPlan.update({
      where: { id: planId },
      data: { isActive: false },
    });
  },
  updatePlan: async (planId: string, therapistId: string, input: UpdatePlanInput) => {
    // 1. Verify ownership: plan must belong to a program owned by this therapist
    const plan = await prisma.programPlan.findFirst({
      where: {
        id: planId,
        program: { therapistId },
      },
      include: { program: true },
    });

    if (!plan) {
      throw new ApiError(404, "Plan not found");
    }

    // 2. Guard: cannot edit plans of a published (active) program
    if (plan.program.isActive) {
      throw new ApiError(400, "Cannot modify plans of a published program");
    }

    // 3. Build validated update data
    const updateData: Prisma.ProgramPlanUpdateInput = {};

    if (input.name !== undefined) {
      const trimmedName = input.name.trim();
      if (trimmedName.length === 0) {
        throw new ApiError(400, "Plan name cannot be empty");
      }
      updateData.name = trimmedName;
    }

    if (input.sessionsCount !== undefined) {
      if (!Number.isInteger(input.sessionsCount) || input.sessionsCount < 1) {
        throw new ApiError(400, "sessionsCount must be a positive integer");
      }
      updateData.sessionsCount = input.sessionsCount;
    }

    if (input.sessionDuration !== undefined) {
      if (!Number.isInteger(input.sessionDuration) || input.sessionDuration < 1) {
        throw new ApiError(400, "sessionDuration must be a positive integer (minutes)");
      }
      updateData.sessionDuration = input.sessionDuration;
    }

    if (input.price !== undefined) {
      if (typeof input.price !== "number" || input.price <= 0) {
        throw new ApiError(400, "price must be a positive number");
      }
      updateData.price = input.price;
      updateData.pricePaise = rupeesToPaise(input.price);
    }

    if (input.cadence !== undefined) {
      if (!Object.values(ProgramCadence).includes(input.cadence)) {
        throw new ApiError(
          400,
          `cadence must be one of: ${Object.values(ProgramCadence).join(", ")}`
        );
      }
      updateData.cadence = input.cadence;
    }

    if (input.recommendedGapDays !== undefined) {
      if (input.recommendedGapDays === null) {
        updateData.recommendedGapDays = null;
      } else {
        if (!Number.isInteger(input.recommendedGapDays) || input.recommendedGapDays < 0) {
          throw new ApiError(400, "recommendedGapDays must be a non-negative integer or null");
        }
        updateData.recommendedGapDays = input.recommendedGapDays;
      }
    }

    // 4. Ensure at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, "No valid fields provided for update");
    }

    return prisma.programPlan.update({
      where: { id: planId },
      data: updateData,
    });
  },
  fetchProgramBookings: async (therapistId: string) => {
    const bookings = await prisma.programPurchase.findMany({
      where: { therapistId },
      include: {
        program: {
          select: {
            id: true,
            title: true,
          },
        },
        programPlan: {
          select: {
            id: true,
            name: true,
            sessionsCount: true,
          },
        },
        client: {
          include: { user: true },
        },
        therapist: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return bookings.map((purchase) => {
      const remainingSessions = purchase.totalSessions - purchase.usedSessions;

      return {
        id: purchase.id,

        program: {
          id: purchase.program.id,
          title: purchase.program.title,
        },

        plan: {
          id: purchase.programPlan.id,
          name: purchase.programPlan.name,
          totalSessions: purchase.totalSessions,
        },

        therapist: {
          id: purchase.therapist.id,
          name: purchase.therapist.user.firstName + " " + purchase.therapist.user.lastName,
        },

        client: {
          id: purchase.client.id,
          name: purchase.client.user.firstName + " " + purchase.client.user.lastName,
        },

        usage: {
          totalSessions: purchase.totalSessions,
          usedSessions: purchase.usedSessions,
          remainingSessions,
        },

        status: purchase.status,
        validFrom: purchase.validFrom,
        validTill: purchase.validTill,
        canBookSlot: false,
        createdAt: purchase.createdAt,
      };
    });
  },
  fetchProgramPurchaseById: async (purchaseId: string) => {
    const bookings = await prisma.booking.findMany({
      where: {
        programPurchaseId: purchaseId,
      },
      select: {
        id: true,
        startDateTime: true,
        endDateTime: true,
        meetingLink: true,
        hasTherapistRescheduledEarlier: true,
        rescheduleStatus: true,
        programPurchase: {
          select: {
            program: {
              select: {
                id: true,
                title: true,
                description: true,
              },
            },
            programPlan: {
              select: {
                name: true,
              },
            },
            client: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            totalSessions: true,
            usedSessions: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return bookings.map((booking) => {
      const permissions = therapistBookingPermission(
        booking.startDateTime,
        booking.endDateTime,
        booking.hasTherapistRescheduledEarlier,
        booking.rescheduleStatus
      );
      return {
        ...booking,
        meetingLink: permissions.canJoinSession ? booking.meetingLink : null,
        canJoinSession: permissions.canJoinSession,
        canReschedule: permissions.canReschedule,
      };
    });
  },
};

export default ProgramService;
