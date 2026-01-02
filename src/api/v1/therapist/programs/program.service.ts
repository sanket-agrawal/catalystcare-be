import ApiError from "../../../../shared/utils/ApiError";
import {CreateProgramInput, ProgramCadence} from "./program.dto";
import {prisma} from "../../../../infrastructure/prisma/client";
import { Prisma } from "@prisma/client";
import { rupeesToPaise } from "../../../../shared/lib/money";

const  ProgramService = {
createProgram : async (therapistId : string,input: CreateProgramInput) => {
  if (!input.plans?.length) {
    throw new ApiError(400, "At least one plan is required");
  }

  return prisma.$transaction(async (tx : Prisma.TransactionClient) => {
    const program = await tx.program.create({
      data: {
        therapistId: therapistId,
        title: input.title,
        description: input.description,
        outcome: input.outcome,
        plans: {
          create: input.plans.map(plan => ({
            name: plan.name,
            sessionsCount: plan.sessionsCount,
            sessionDuration: plan.sessionDuration,
            price : plan.price,
            pricePaise: rupeesToPaise(plan.price),
            cadence: plan.cadence,
            recommendedGapDays: plan.recommendedGapDays
          }))
        }
      },
      include: { plans: true }
    });

    return program;
  });
},
fetchAllPrograms : async (therapistId : string) => {
    return prisma.program.findMany({
        where : {
            therapistId
        },
        select : {
            id : true,
            title : true,
            description : true,
            outcome : true,
            createdAt : true,
            isActive : true,
            plans : true
        },
        orderBy : { updatedAt :"desc"}
    })
},
updateProgram : async (
  programId: string,
  therapistId: string,
  data: {
    title?: string;
    description?: string;
    outcome?: string;
  }
) => {
  const program = await prisma.program.findFirst({
    where: { id: programId, therapistId }
  });

  if (!program) {
    throw new ApiError(404, "Program not found");
  }

  if (program.isActive) {
    throw new ApiError(400, "Cannot edit a published program");
  }

  return prisma.program.update({
    where: { id: programId },
    data
  });
},
publishProgram : async (programId: string, therapistId: string) => {
  const program = await prisma.program.findFirst({
    where: { id: programId, therapistId },
    include: { plans: { where: { isActive: true } } }
  });

  if (!program) {
    throw new ApiError(404, "Program not found");
  }

  if (!program.plans.length) {
    throw new ApiError(400, "At least one active plan is required to publish");
  }

  return prisma.program.update({
    where: { id: programId },
    data: { isActive: true }
  });
},
unPublishProgram : async (programId: string, therapistId: string) => {
  const program = await prisma.program.findFirst({
    where: { id: programId, therapistId }
  });

  if (!program) {
    throw new ApiError(404, "Program not found");
  }

  return prisma.program.update({
    where: { id: programId },
    data: { isActive: false }
  });
},
addPlanToProgram : async (
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
    where: { id: programId, therapistId }
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
      name : plan.name,
      sessionsCount: plan.sessionsCount,
    sessionDuration: plan.sessionDuration,
    price: plan.price,
    pricePaise : rupeesToPaise(plan.price),
    cadence: plan.cadence,
    recommendedGapDays : plan.recommendedGapDays
    }
  });
},
publishPlan : async (planId: string, therapistId: string) => {
  const plan = await prisma.programPlan.findFirst({
    where: {
      id: planId,
      program: { therapistId }
    }
  });

  if (!plan) {
    throw new ApiError(404, "Plan not found");
  }

  return prisma.programPlan.update({
    where: { id: planId },
    data: { isActive: true }
  });
},
unPublishPlan : async (planId: string, therapistId: string) => {
  const plan = await prisma.programPlan.findFirst({
    where: {
      id: planId,
      program: { therapistId }
    }
  });

  if (!plan) {
    throw new ApiError(404, "Plan not found");
  }

  return prisma.programPlan.update({
    where: { id: planId },
    data: { isActive: false }
  });
}
}

export default ProgramService;