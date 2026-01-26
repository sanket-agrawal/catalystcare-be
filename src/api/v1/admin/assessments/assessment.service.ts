import { emailQueue } from "../../../../infrastructure/queues";
import { prisma } from "../../../../infrastructure/prisma/client";
import ApiError from "../../../../shared/utils/ApiError";
import slugify from "slugify";
import { calculateBurnoutScore, mapBurnoutResult } from "../../../../shared/lib/burnout.scoring";
import { emailFromAddress, emailSubjects } from "../../../../shared/config/email.config";
import { assessmentResultTemplate } from "../../../../shared/email-templates/assessmentResults";

interface AssessmentGuidelines {
  does: string[];
  doesNot: string[];
}

interface CreateAssessmentInput {
  title: string;
  description?: string;
  icon?: string;
  poster?: string;
  verifiedBy? : string;
  targetAudience? : string;
  guidelines? : AssessmentGuidelines
}



interface UpdateAssessmentInput {
  title?: string;
  description?: string;
  icon?: string;
  poster?: string;
    verifiedBy? : string;
  targetAudience? : string;
  guidelines? : AssessmentGuidelines
}

export interface AssessmentAnswerPayload {
  questionId: string;
  optionId: string;
}

export interface SubmitAssessmentPayload {
  slug : string;
  email: string;
  name?: string;
  answers: AssessmentAnswerPayload[];
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
        verifiedBy : data.verifiedBy,
        targetAudience : data.targetAudience,
        guidelines : data.guidelines,
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

  async submitAssessment(data: SubmitAssessmentPayload) {
    const { email, name, answers, slug } = data;

    if (!email || !answers?.length) {
      throw new ApiError(400, "Email and answers are required");
    }

    const assessment = await prisma.assessment.findFirst({
      where: { slug, isActive: true },
      include: {
        questions: {
          where: { isActive: true },
          include: { options: true }
        }
      }
    });

    if (!assessment) {
      throw new ApiError(404, "Assessment not found");
    }

    // Validate answers
    const answerMap: Record<string, number> = {};

    for (const ans of answers) {
      const question = assessment.questions.find( (q: { id: string; order: number; options: { id: string; weight: number }[] }) => q.id === ans.questionId);
      if (!question) continue;

      const option = question.options.find((o: { id: string; weight: number }) => o.id === ans.optionId);
      if (!option) continue;

      answerMap[`Q${question.order}`] = option.weight;
    }

    // Scoring strategy
    const rawScore = calculateBurnoutScore(answerMap);
    const mapped = mapBurnoutResult(rawScore.burnoutIndex);

    const finalResult = {
  ...rawScore,
  ...mapped
};

    // Optional persistence
    await prisma.assessmentSubmission.create({
      data: {
        assessmentId: assessment.id,
        email,
        name,
        assessmentIndex: rawScore.burnoutIndex,
        dominantArea: rawScore.dominant
      }
    });

    // Increment takers
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: { totalTakers: { increment: 1 } }
    });

    // Email async
   await emailQueue.add('send-assessment-result',{
      to : email,
      subject : emailSubjects(undefined, undefined, assessment.title).assessmentResults,
      html : assessmentResultTemplate(name, assessment.title, finalResult),
      sender : emailFromAddress().infoEmail
    });
  },

  async fetchSubmissionsById(assessmentId : string){
    try{
         const submissions = await prisma.assessmentSubmission.findMany({
          where : {assessmentId}
         });

         console.log(submissions);

         return submissions;
    } catch (error) {
      throw new ApiError(500, "Failed to fetch submissions");
    }
  }
};
