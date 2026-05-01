import { emailQueue } from "../../../../infrastructure/queues";
import { prisma } from "../../../../infrastructure/prisma/client";
import ApiError from "../../../../shared/utils/ApiError";
import slugify from "slugify";
import { emailFromAddress, emailSubjects } from "../../../../shared/config/email.config";
import { assessmentResultTemplate } from "../../../../shared/email-templates/assessmentResults";
import { getZoneContent, getAssessmentConfig } from "../../../../shared/insights/Assessments";
import {
  AssessmentResult,
  AnswerPayload,
  calculateAssessmentScore,
  interpretScale
} from "../../../../shared/lib/scoring";
import { generateResultsEmailHTML } from "../../../../shared/email-templates/result";
import { zoneInsights } from "../../../../shared/lib/assessment.scoring";

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
  targetAudience? : string[];
  guidelines : AssessmentGuidelines,
  minTime? : number,
  maxTime? : number,
  numberOfStatements? : number
}



interface UpdateAssessmentInput {
  title?: string;
  description?: string;
  icon?: string;
  poster?: string;
    verifiedBy? : string;
  targetAudience? : string[];
  guidelines? : AssessmentGuidelines,
  minTime? : number,
  maxTime? : number,
  numberOfStatements? : number
}

export interface AssessmentAnswerPayload {
  questionId: string;
  optionId?: string;
  optionWeight?: number;
}

export interface SubmitAssessmentPayload {
  slug : string;
  email: string;
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
          minTime : data.minTime,
          maxTime : data.maxTime,
          numberOfStatements : data.numberOfStatements,
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
    const { email, answers, slug } = data;

    if (!email || !answers?.length) {
      throw new ApiError(400, "Email and answers are required");
    }

    const assessment = await prisma.assessment.findFirst({
      where: { slug, isActive: true },
      include: {
        zones: true,
        questions: {
          where: { isActive: true },
          include: { zone : true }
        }
      }
    });

    if (!assessment) {
      throw new ApiError(404, "Assessment not found");
    }

    const config = getAssessmentConfig(assessment.slug);

    

      const questionMap = new Map(
        assessment.questions.map(q => [q.id, q])
      );

      const zoneScores: Record<string, number> = {};
      const zoneMeta: Record<string, { max: number; title: string }> = {};

       assessment.zones.forEach(z => {
    zoneScores[z.key] = 0;
    zoneMeta[z.key] = {
      max: z.maxRawScore,
      title: z.title
    };
  });

for (const answer of data.answers) {
  const question = questionMap.get(answer.questionId);
  
  // Type guard function
  const hasValidZone = (q: unknown): q is { zone: { key: string }, isReverse?: boolean } => {
    return (
      typeof q === 'object' &&
      q !== null &&
      'zone' in q &&
      q.zone !== null &&
      typeof q.zone === 'object' &&
      'key' in q.zone
    );
  };
  
  if (!question || !hasValidZone(question)) {
    continue;
  }

  const zoneKey = question.zone.key;

  let value = answer.optionWeight;

  if (question.isReverse === true) {
    value = 4 - value; // GLOBAL STANDARD (0–4)
  }

  zoneScores[zoneKey] += value;
}

   const finalScores: Record<string, any> = {};
  let primaryZone = "";
  let highestScore = -1;

  // for (const [zoneKey, rawScore] of Object.entries(zoneScores)) {
  //   const max = zoneMeta[zoneKey].max;
  //   const scaled = Math.round((rawScore / max) * 100);

  //   const label =
  //     scaled < 30 ? "Not a significant concern" :
  //     scaled < 50 ? "Mild strain" :
  //     scaled < 70 ? "Active strain" :
  //     "Strong strain";

  //   finalScores[zoneKey] = {
  //     rawScore,
  //     scaledScore: scaled,
  //     label
  //   };

  //   if (scaled > highestScore) {
  //     highestScore = scaled;
  //     primaryZone = zoneKey;
  //   }
  // }

    for (const [zoneKey, rawScore] of Object.entries(zoneScores)) {
    const max = zoneMeta[zoneKey].max;
    const scaled = Math.round((rawScore / max) * 100);
 
    // Pull label from config if available, otherwise fall back to generic
    const band =
      scaled < 30 ? "0-29" :
      scaled < 50 ? "30-49" :
      scaled < 70 ? "50-69" : "70-100";
 
    const label =
      config?.zones[zoneKey]?.bands[band]?.label ??
      (scaled < 30 ? "Not a significant concern" :
       scaled < 50 ? "Mild strain" :
       scaled < 70 ? "Active strain" :
       "Strong strain");
 
    finalScores[zoneKey] = {
      rawScore,
      scaledScore: scaled,
      label
    };
 
    if (scaled > highestScore) {
      highestScore = scaled;
      primaryZone = zoneKey;
    }
  }

    const submission = await prisma.assessmentSubmission.create({
    data: {
      assessmentId: assessment.id,
      email: data.email,
      scores: finalScores,
      primaryZone
    }
  });

  // Increment counter
  await prisma.assessment.update({
    where: { id: assessment.id },
    data: { totalTakers: { increment: 1 } }
  });

  const zonesForEmail = Object.entries(finalScores).map(
  ([key, value]: any) => ({
    key,
    title: zoneMeta[key].title,
    scaledScore: value.scaledScore,
    label: value.label
  })
);

const primaryZoneData = zonesForEmail.find(
  z => z.key === primaryZone
);

if (!primaryZoneData) {
  throw new ApiError(500, "Primary zone resolution failed");
}



  //     await emailQueue.add("send-assessment-result", {
  //     to: email,
  //     subject: emailSubjects(undefined, undefined, assessment.title).assessmentResults,
  //     html: assessmentResultTemplate({
  //   assessmentTitle: assessment.title,
  //   primaryZone: {
  //     key: primaryZoneData.key,
  //     title: primaryZoneData.title,
  //     scaledScore: primaryZoneData.scaledScore,
  //     label: primaryZoneData.label,
  //     insight:
  //       zoneInsights[primaryZoneData.key] ??
  //       "This area is currently asking for the most care and attention."
  //   },
  //   zones: zonesForEmail
  // }),
  //     sender: emailFromAddress().infoEmail
  //   });

    await emailQueue.add("send-assessment-result", {
    to: email,
    subject: emailSubjects(undefined, undefined, assessment.title).assessmentResults,
    html: assessmentResultTemplate({
      assessmentTitle: assessment.title,
      assessmentSlug: assessment.slug,   // <-- ADD THIS
      primaryZone: {
        key: primaryZoneData.key,
        title: primaryZoneData.title,
        scaledScore: primaryZoneData.scaledScore,
        label: primaryZoneData.label,
        // insight field removed — template now handles this internally
      },
      zones: zonesForEmail
    }),
    sender: emailFromAddress().infoEmail
  });

    return {
    submissionId: submission.id,
    primaryZone,
    scores: finalScores
  };


    // Guard against misconfigured assessments (zone required for scoring)
    // const questionsMissingZone = assessment.questions.filter((q) => !q.zone || !(q as any).zone?.key);
    // if (questionsMissingZone.length > 0) {
    //   throw new ApiError(
    //     500,
    //     `Assessment misconfigured: ${questionsMissingZone.length} active question(s) missing zone`
    //   );
    // }

    // 1️⃣ Normalise answers:
    // - preferred: questionId + optionWeight (validated against allowed weights for that question)
    // - legacy: questionId + optionId (mapped to weight from DB)
    // const normalisedAnswers: AnswerPayload[] = answers
    //   .map((answer) => {
    //     const question = assessment.questions.find((q) => q.id === answer.questionId);
    //     if (!question || !question.options || question.options.length === 0) {
    //       return null;
    //     }

    //     // Legacy shape: optionId -> DB weight
    //     if (answer.optionId) {
    //       const option = question.options.find((o: any) => o.id === answer.optionId);
    //       if (!option) return null;
    //       return { questionId: answer.questionId, optionWeight: Number(option.weight) || 0 } as AnswerPayload;
    //     }

    //     // New shape: optionWeight -> validate against allowed weights
    //     const w = Number(answer.optionWeight);
    //     if (!Number.isFinite(w)) return null;

    //     const allowedWeights = new Set(
    //       question.options.map((o: any) => Number(o.weight) || 0)
    //     );
    //     if (!allowedWeights.has(w)) {
    //       return null;
    //     }

    //     return { questionId: answer.questionId, optionWeight: w } as AnswerPayload;
    //   })
    //   .filter((a): a is AnswerPayload => a !== null);

    // if (!normalisedAnswers.length) {
    //   throw new ApiError(400, "No valid answers provided for scoring");
    // }

    // // Require full completion (production-grade: don't score partial submissions silently)
    // if (normalisedAnswers.length !== assessment.questions.length) {
    //   throw new ApiError(
    //     400,
    //     `Incomplete answers: expected ${assessment.questions.length}, got ${normalisedAnswers.length}`
    //   );
    // }

    // 2️⃣ Calculate scores with validated weights
    // const scoreResult = calculateAssessmentScore(
    //   assessment.questions,
    //   normalisedAnswers
    // );

    // 3️⃣ Persist submission
    // await prisma.assessmentSubmission.create({
    //   data: {
    //     assessmentId: assessment.id,
    //     email: data.email,
    //     scores: scoreResult.zones,
    //     primaryZone: scoreResult.primaryZone
    //   }
    // });

    // await prisma.assessment.update({
    //   where: { id: assessment.id },
    //   data: { totalTakers: { increment: 1 } }
    // });

    // 4️⃣ Build zone metadata for email
    // const zoneMeta = (assessment.zones ?? []).reduce((acc, z) => {
    //   acc[z.key] = { name: z.title };
    //   return acc;
    // }, {} as Record<string, { name: string }>);

    // // 5️⃣ Build email data
    // const emailData = buildResultsEmailData(
    //   assessment.title,
    //   email,
    //   scoreResult,
    //   zoneMeta
    // );

    // 6️⃣ Generate HTML
    // const builtHTML = generateResultsEmailHTML({
    //   assessmentTitle: emailData.assessmentTitle,
    //   results: emailData.zones,
    //   highestBlocker: emailData.primaryZone,
    //   contextExplanation: emailData.contextExplanation,
    //   focusAdvice: emailData.focusAdvice
    // });

    // 7️⃣ Queue email (async)
    // await emailQueue.add("send-assessment-result", {
    //   to: email,
    //   subject: emailSubjects(undefined, undefined, assessment.title).assessmentResults,
    //   html: builtHTML,
    //   sender: emailFromAddress().infoEmail
    // });

    // 8️⃣ Return structured response for API consumer
    // return {
    //   title: assessment.title,
    //   email,
    //   scores: scoreResult.zones,
    //   primaryZone: scoreResult.primaryZone,
    //   zones: emailData.zones
    // };
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

export interface ZoneResult {
  key: string;        // internal key (ENERGY, OVERLOAD, etc.)
  name: string;       // display name
  score: number;      // 0–100
  label: string;      // Mild strain, Active blocker, etc.
}

export interface ResultsEmailData {
  assessmentTitle: string;
  email: string;
  zones: ZoneResult[];
  primaryZone: ZoneResult;
  contextExplanation: string;
  focusAdvice: string;
  safetyNote?: string;
}

const CONTEXT_BY_ZONE_KEY: Record<string, string> = {
  ENERGY: "Your system feels under-fuelled. Even rest may not be fully restoring you right now.",
  MENTAL: "Cognitive pressure and constant demands are draining your capacity.",
  DISENGAGEMENT: "You may be operating on autopilot, pushing through without recovery.",

  OVERLOAD: "Too many open tasks and decisions are competing for your attention.",
  FEAR: "Fear of mistakes or judgement may be slowing your ability to start.",
  ATTENTION: "Your attention system feels fragmented and overstimulated."
};


const ADVICE_BY_ZONE_KEY: Record<string, string> = {
  ENERGY: "Prioritise recovery before productivity. Reduce output expectations temporarily.",
  MENTAL: "Reduce open loops. Write everything down and choose one task only.",
  DISENGAGEMENT: "Slow down and reconnect. Stop pushing through exhaustion.",

  OVERLOAD: "Reduce choices. Pick one priority and ignore the rest for now.",
  FEAR: "Lower the stakes. Start imperfectly and allow small progress.",
  ATTENTION: "Simplify your environment. Reduce digital switching."
};


const getSafetyNote = (zones: ZoneResult[]): string | undefined => {
  const highZones = zones.filter(z => z.score >= 70);
  if (highZones.length >= 2) {
    return "Strong strain across multiple areas can benefit from professional mental health support.";
  }
  return undefined;
};

export const buildResultsEmailData = (
  assessmentTitle: string,
  email: string,
  scoreResult: AssessmentResult,
  zoneMeta: Record<string, { name: string }>
) => {

  const zones: ZoneResult[] = Object.entries(scoreResult.zones).map(
    ([key, zoneScore]) => ({
      key,
      name: zoneMeta[key]?.name ?? key,
      score: zoneScore.scaled,
      label: interpretScale(zoneScore.scaled)
    })
  );

  // Sort zones by severity (highest score first)
  zones.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const primaryZoneFromKey = zones.find(
    z => z.key === scoreResult.primaryZone
  );

  const primaryZone = primaryZoneFromKey ?? zones[0];

  const contextExplanation =
    (primaryZone && CONTEXT_BY_ZONE_KEY[primaryZone.key]) ||
    "Your system feels under-fuelled. Even rest may not be fully restoring you right now.";

  const focusAdvice =
    (primaryZone && ADVICE_BY_ZONE_KEY[primaryZone.key]) ||
    "Prioritise recovery before productivity. Reduce output expectations temporarily.";

  const safetyNote = getSafetyNote(zones);

  return {
    assessmentTitle,
    email,
    zones,
    primaryZone,
    contextExplanation,
    focusAdvice,
    safetyNote
  };
};



// const buildResultsEmailData = (
//   assessmentTitle: string,
//   email: string,
//   scoreResult: {
//     zones: Record<string, { raw: number; scaled: number }>;
//     primaryZone: string;
//   },
//   zoneMeta: Record<string, { name: string }>
// ): ResultsEmailData => {

//   const zones: ZoneResult[] = Object.entries(scoreResult.zones).map(
//     ([key, value]) => ({
//       key,
//       name: zoneMeta[key]?.name ?? key,
//       score: value.scaled,
//       label: SCALE_LABEL(value.scaled)
//     })
//   );

//   zones.sort((a, b) => b.score - a.score);

//   const primaryZone = zones.find(z => z.key === scoreResult.primaryZone)!;

//   return {
//     assessmentTitle,
//     email,
//     zones,
//     primaryZone,
//     contextExplanation: CONTEXT_BY_ZONE_KEY[primaryZone.key] ?? "",
//     focusAdvice: ADVICE_BY_ZONE_KEY[primaryZone.key] ?? "",
//     safetyNote: getSafetyNote(zones)
//   };
// };



