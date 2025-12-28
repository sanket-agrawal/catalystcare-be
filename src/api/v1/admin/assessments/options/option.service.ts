import { prisma } from "../../../../../infrastructure/prisma/client";
import ApiError from "../../../../../shared/utils/ApiError";

interface CreateOptionInput {
  questionId: string;
  label: string;
  weight: number;
  order: number;
}

interface UpdateOptionInput {
  label?: string;
  weight?: number;
  order?: number;
}

export const assessmentOptionService = {
  async createOption(data: CreateOptionInput) {
    const question = await prisma.assessmentQuestion.findUnique({
      where: { id: data.questionId },
      include: { assessment: true },
    });

    if (!question) {
      throw new ApiError(404, "Question not found");
    }

    if (question.assessment.isActive) {
      throw new ApiError(400, "Cannot add options to published assessment");
    }

    const orderExists = await prisma.assessmentOption.findFirst({
      where: {
        questionId: data.questionId,
        order: data.order,
      },
    });

    if (orderExists) {
      throw new ApiError(409, "Option order already exists");
    }

    return prisma.assessmentOption.create({ data });
  },

  async updateOption(id: string, data: UpdateOptionInput) {
    const option = await prisma.assessmentOption.findUnique({
      where: { id },
      include: {
        question: { include: { assessment: true } },
      },
    });

    if (!option) {
      throw new ApiError(404, "Option not found");
    }

    if (option.question.assessment.isActive) {
      throw new ApiError(400, "Cannot edit options of published assessment");
    }

    if (data.order !== undefined) {
      const orderExists = await prisma.assessmentOption.findFirst({
        where: {
          questionId: option.questionId,
          order: data.order,
          id: { not: id },
        },
      });

      if (orderExists) {
        throw new ApiError(409, "Option order already exists");
      }
    }

    return prisma.assessmentOption.update({
      where: { id },
      data,
    });
  },

  async deleteOption(id: string) {
    const option = await prisma.assessmentOption.findUnique({
      where: { id },
      include: {
        question: { include: { assessment: true } },
      },
    });

    if (!option) {
      throw new ApiError(404, "Option not found");
    }

    if (option.question.assessment.isActive) {
      throw new ApiError(400, "Cannot delete options of published assessment");
    }

    return prisma.assessmentOption.delete({ where: { id } });
  },
};
