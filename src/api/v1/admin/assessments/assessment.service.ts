import { prisma } from "../../../../infrastructure/prisma/client";
import ApiError from "../../../../shared/utils/ApiError";
import slugify from "slugify";

interface CreateAssessmentInput {
  title: string;
  description?: string;
  icon?: string;
  poster?: string;
}

interface UpdateAssessmentInput {
  title?: string;
  description?: string;
  icon?: string;
  poster?: string;
}

export const assessmentService = {
  async createAssessment(data: CreateAssessmentInput) {
    const slug = slugify(data.title, { lower: true, strict: true });

    const existing = await prisma.assessment.findFirst({
      where: { slug },
    });

    if (existing) {
      throw new ApiError(409, "Assessment with same title already exists");
    }

    return prisma.assessment.create({
      data: {
        title: data.title,
        description: data.description,
        icon: data.icon,
        poster: data.poster,
        slug,
        isActive: false, // created as DRAFT
      },
    });
  },

  async updateAssessment(id: string, data: UpdateAssessmentInput) {
    const assessment = await prisma.assessment.findUnique({ where: { id } });

    if (!assessment) {
      throw new ApiError(404, "Assessment not found");
    }

    // Slug immutability after publish
    if (assessment.isActive && data.title) {
      throw new ApiError(
        400,
        "Published assessment title cannot be changed"
      );
    }

    let slug: string | undefined;

    if (data.title && !assessment.isActive) {
      slug = slugify(data.title, { lower: true, strict: true });

      const slugExists = await prisma.assessment.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });

      if (slugExists) {
        throw new ApiError(409, "Assessment with same title already exists");
      }
    }

    return prisma.assessment.update({
      where: { id },
      data: {
        ...data,
        ...(slug && { slug }),
      },
    });
  },

  async publishAssessment(id: string) {
    const assessment = await prisma.assessment.findUnique({ where: { id } });

    if (!assessment) {
      throw new ApiError(404, "Assessment not found");
    }

    const activeQuestions = await prisma.assessmentQuestion.count({
      where: {
        assessmentId: id,
        isActive: true,
      },
    });

    if (activeQuestions === 0) {
      throw new ApiError(
        400,
        "Cannot publish assessment without active questions"
      );
    }

    return prisma.assessment.update({
      where: { id },
      data: { isActive: true },
    });
  },

  async unpublishAssessment(id: string) {
    const assessment = await prisma.assessment.findUnique({ where: { id } });

    if (!assessment) {
      throw new ApiError(404, "Assessment not found");
    }

    if(!assessment.isActive) {
      throw new ApiError(400, "Assessment is already unpublished");
    }

    return prisma.assessment.update({
      where: { id },
      data: { isActive: false },
    });
  },

  async getAllAssessments() {
    return prisma.assessment.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        title : true,
        id : true,
        slug : true,
        isActive : true,
        createdAt : true,
        description : true,
        questions : {
          orderBy : { order : "asc" },
          select : {
            id : true,
            text : true,
            order : true,
            isActive : true,
            options : {
              orderBy : { order : "asc" },
              select : {
                id : true,
                label : true,
                weight : true,
                order : true
              }
            }
          }
        }
      }
    });
  },
};
