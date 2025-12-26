import { prisma } from "../../../../../infrastructure/prisma/client";
import ApiError from "../../../../../shared/utils/ApiError";

interface CreateQuestionInput {
  assessmentId: string;
  text: string;
  order: number;
  category?: string;
}

interface UpdateQuestionInput {
  text?: string;
  order?: number;
  category?: string;
  isActive?: boolean;
}

export const assessmentQuestionService = {
  async createQuestion(data: CreateQuestionInput) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: data.assessmentId },
    });

    if (!assessment) {
      throw new ApiError(404, "Assessment not found");
    }

    if (assessment.isActive) {
      throw new ApiError(400, "Cannot add questions to published assessment");
    }

    const orderExists = await prisma.assessmentQuestion.findFirst({
      where: {
        assessmentId: data.assessmentId,
        order: data.order,
      },
    });

    if (orderExists) {
      throw new ApiError(409, "Question order already exists");
    }

    return prisma.assessmentQuestion.create({
      data,
    });
  },

  async updateQuestion(id: string, data: UpdateQuestionInput) {
    const question = await prisma.assessmentQuestion.findUnique({
      where: { id },
      include: { assessment: true },
    });

    if (!question) {
      throw new ApiError(404, "Question not found");
    }

    if (question.assessment.isActive) {
      // Only activation allowed after publish
      if (Object.keys(data).some(k => k !== "isActive")) {
        throw new ApiError(
          400,
          "Only activation status can be changed after publish"
        );
      }
    }

    if (data.order !== undefined) {
      const orderExists = await prisma.assessmentQuestion.findFirst({
        where: {
          assessmentId: question.assessmentId,
          order: data.order,
          id: { not: id },
        },
      });

      if (orderExists) {
        throw new ApiError(409, "Question order already exists");
      }
    }

    return prisma.assessmentQuestion.update({
      where: { id },
      data,
    });
  },

  async deleteQuestion(id: string) {
    const question = await prisma.assessmentQuestion.findUnique({
      where: { id },
      include: { assessment: true },
    });

    if (!question) {
      throw new ApiError(404, "Question not found");
    }

    if (question.assessment.isActive) {
      throw new ApiError(400, "Cannot delete question from published assessment");
    }

    return prisma.assessmentQuestion.delete({ where: { id } });
  },
};
