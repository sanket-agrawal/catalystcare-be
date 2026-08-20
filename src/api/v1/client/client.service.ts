import ApiError from "../../../shared/utils/ApiError";
import { authenticatedUser } from "../user/user.types";
import { prisma } from "../../../infrastructure/prisma/client";
import { ClientProfileUpdateData, CreateAssessmentInput } from "./client.dto";
import { Prisma } from "@prisma/client";
import { getClientBookingPermissions } from "./client.helper";
import { meetingQueue } from "../../../infrastructure/queues";
import { canRateSession } from "../../../shared/lib/ratings";
import { aiService } from "../ai/ai.service";

type BookingForClientList = {
  id: string;
  endDateTime: Date;
  testimonial: {
    rating: number;
    status: string;
  } | null;
};

export const clientService = {
  async profileUpdate(user: authenticatedUser, data: ClientProfileUpdateData) {
    try {
      const existingProfile = await prisma.clientProfile.findUnique({
        where: {
          userId: user.id,
        },
      });

      let updatedProfile;

      if (existingProfile) {
        updatedProfile = await prisma.clientProfile.update({
          where: { id: existingProfile.id },
          data: {
            ageGroup: data.ageGroup,
            genderIdentity: data.genderIdentity,
            occupation: data.occupation,
            seekingSupportFor: data.seekingSupportFor,
            relationShipStatus: data.relationShipStatus,
          },
        });
      } else {
        updatedProfile = await prisma.clientProfile.create({
          data: {
            userId: user.id,
            ageGroup: data.ageGroup,
            genderIdentity: data.genderIdentity,
            occupation: data.occupation,
            seekingSupportFor: data.seekingSupportFor,
            relationShipStatus: data.relationShipStatus,
          },
        });
      }

      return updatedProfile;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new ApiError(error.statusCode, error.message);
      }
      throw error;
    }
  },
  async assessmentSubmit(userId: string, input: any) {
    try {
      // 1️⃣ Create the assessment
      const newAssessment = await prisma.clientAssesment.create({
        data: {
          ...input,
          userId,
        },
      });

      // 2️⃣ Map field names → categories/subcategories
      const fieldCategoryMap: Record<string, { category: string; subCategory: string }> = {
        recentFeeling: {
          category: "Mood Disorders",
          subCategory: "Depression / Bipolar",
        },
        crowdedWithWorries: {
          category: "Anxiety Disorders",
          subCategory: "Generalized Anxiety Disorder (GAD)",
        },
        roomFullWithPeople: {
          category: "Anxiety Disorders",
          subCategory: "Social Anxiety",
        },
        dailyTaskFeeling: {
          category: "Mood Disorders",
          subCategory: "Depression / Burnout",
        },
        thoughtEcho: {
          category: "Mood Disorders",
          subCategory: "Depression (Self-worth)",
        },
        decision: {
          category: "Cognitive / Personality",
          subCategory: "Overthinking / Avoidance / OCD tendencies",
        },
        oldMemories: {
          category: "Trauma & Stress",
          subCategory: "PTSD / Trauma Triggers",
        },
        lossOrSeperation: {
          category: "Trauma & Stress",
          subCategory: "Grief / Adjustment Disorders",
        },
        closestRelationShip: {
          category: "Personality / Relationship Issues",
          subCategory: "Interpersonal Difficulties / Loneliness",
        },
        sayingNo: {
          category: "Personality / Relationship Issues",
          subCategory: "People-pleasing / Boundaries",
        },
        nightSleep: {
          category: "Lifestyle & Habits",
          subCategory: "Sleep Disorders / Depression / Anxiety",
        },
        eatingPattern: {
          category: "Lifestyle & Habits",
          subCategory: "Eating Disorders / Stress Eating",
        },
        heavyLifeCope: {
          category: "Lifestyle & Habits",
          subCategory: "Substance Use / Maladaptive Coping",
        },
        technologyView: {
          category: "Lifestyle & Habits",
          subCategory: "Digital Addiction / Overstimulation",
        },
        selfImage: {
          category: "Personality / Self",
          subCategory: "Low Self-esteem / Identity Disturbance",
        },
        futurePerspective: {
          category: "Mood Disorders / Self",
          subCategory: "Hopelessness / Depression",
        },
        sucidalThoughts: {
          category: "Red Flag Concerns",
          subCategory: "Suicidality",
        },
        halucinations: {
          category: "Red Flag Concerns",
          subCategory: "Psychosis",
        },
        selfHarm: {
          category: "Red Flag Concerns",
          subCategory: "Suicidal or Homicidal Ideation",
        },
      };

      // 3️⃣ Collect category/subcategory names based on which fields are present in input
      const activeMappings = Object.keys(input)
        .filter((key) => fieldCategoryMap[key])
        .map((key) => fieldCategoryMap[key]);

      const categoryNames = [...new Set(activeMappings.map((m) => m.category))];
      const subCategoryNames = [...new Set(activeMappings.map((m) => m.subCategory))];

      // 4️⃣ Fetch matching therapists
      const recommendedTherapists = await prisma.therapistProfile.findMany({
        where: {
          status: "APPROVED",
          OR: [
            { categories: { some: { name: { in: categoryNames } } } },
            { subCategories: { some: { name: { in: subCategoryNames } } } },
          ],
        },
        include: {
          categories: true,
          subCategories: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              mobileNumber: true,
            },
          },
        },
      });

      // 5️⃣ Return
      return {
        assessment: newAssessment,
        matchedCategories: categoryNames,
        matchedSubCategories: subCategoryNames,
        recommendedTherapists,
      };
    } catch (error) {
      console.error("Error creating assessment:", error);
      throw new ApiError(400, "Failed to create assessment");
    }
  },

  async getAssessments(userId: string) {
    try {
      const assessments = await prisma.clientAssesment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      return assessments;
    } catch (error) {
      console.error("Error fetching assessments:", error);
      throw new ApiError(400, "Failed to fetch assessments");
    }
  },
  async getTherapistByUserNeeds(user: authenticatedUser, assessmentId: string) {
    try {
    } catch (error) {
      if (error instanceof ApiError) {
        throw new ApiError(error.statusCode, error.message);
      }
      throw error;
    }
  },
  async fetchBookings(clientId: string) {
    try {
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { id: clientId },
        select: { aiSummary: true, userId: true },
      });

      const latestAssessment = clientProfile
        ? await prisma.clientAssesment.findFirst({
            where: { userId: clientProfile.userId },
            orderBy: { createdAt: "desc" },
          })
        : null;

      const bookings = await prisma.booking.findMany({
        where: {
          clientId: clientId,
          paymentStatus: "CAPTURED",
          status: { in: ["CONFIRMED", "CANCELLED"] },
        },
        include: {
          therapist: {
            select: {
              id: true,
              slug: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profilePhoto: true,
                },
              },
            },
          },
          testimonial: {
            select: {
              rating: true,
              status: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      // return bookings;
      return bookings.map((booking) => {
        const permission = clientBookingPermission(
          booking.startDateTime,
          booking.endDateTime,
          booking.hasClientRescheduledEarlier,
          booking.rescheduleStatus
        );

        const today = new Date();
        const bookingDate = new Date(booking.startDateTime);

        const isSameDay =
          today.getFullYear() === bookingDate.getFullYear() &&
          today.getMonth() === bookingDate.getMonth() &&
          today.getDate() === bookingDate.getDate();

        return {
          ...booking,
          meetingLink: isSameDay && booking.status !== "CANCELLED" ? booking.meetingLink : null,
          hasRated: !!booking.testimonial,
          canRate:
            !booking.testimonial &&
            new Date() > booking.endDateTime &&
            booking.status !== "CANCELLED",
          // permissions: getClientBookingPermissions(booking.startDateTime),
          canJoinSession: isSameDay && booking.status !== "CANCELLED",
          canReschedule: permission.canReschedule && booking.status !== "CANCELLED",
          rescheduleStatus: permission.rescheduleStatus,
          isCancelled: booking.status === "CANCELLED",
          cancellationReason: booking.cancellationReason,
          coverSummary: clientProfile?.aiSummary || null,
          intakeForm: latestAssessment || null,
          message: booking.sessionNotes || null,
        };
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw new ApiError(error.statusCode, error.message);
      }
      throw error;
    }
  },
  async clientPendingActionList(clientId: string) {
    try {
    } catch (error) {
      if (error instanceof ApiError) {
        throw new ApiError(error.statusCode, error.message);
      } else {
        throw error;
      }
    }
  },
  async pendingList(clientId: string) {
    try {
      const now = new Date();
      const next15Min = new Date(now.getTime() + 15 * 60 * 1000);

      const pendingItems: any[] = [];

      /* ----------------------------------
       1. SINGLE SESSION (slot-based)
    ----------------------------------- */
      const singleBooking = await prisma.booking.findFirst({
        where: {
          clientId,
          paymentStatus: "CAPTURED",
          status: "CONFIRMED",
          AND: [{ startDateTime: { lte: next15Min } }, { endDateTime: { gt: now } }],
        },
        include: {
          therapist: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profilePhoto: true,
                },
              },
            },
          },
        },
        orderBy: { startDateTime: "asc" },
      });

      if (singleBooking) {
        const permission = clientBookingPermission(
          singleBooking.startDateTime,
          singleBooking.endDateTime,
          singleBooking.hasClientRescheduledEarlier,
          singleBooking.rescheduleStatus
        );

        pendingItems.push({
          type: "SESSION",
          bookingType: "SINGLE",
          data: {
            bookingId: singleBooking.id,

            therapist: singleBooking.therapist,

            startDateTime: singleBooking.startDateTime,
            endDateTime: singleBooking.endDateTime,

            canJoinSession: permission.canJoinSession,
            canReschedule: permission.canReschedule,

            meetingLink: permission.canJoinSession ? singleBooking.meetingLink : null,

            isUpcoming: now < singleBooking.startDateTime,
          },
        });
      }

      /* ----------------------------------
       2. PROGRAM PURCHASES (slot pending)
    ----------------------------------- */
      const programPurchases = await prisma.programPurchase.findMany({
        where: {
          clientId,
          status: "ACTIVE",
          validTill: { gt: now },
        },
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
          therapist: {
            include: { user: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      for (const purchase of programPurchases) {
        const remainingSessions = purchase.totalSessions - purchase.usedSessions;

        if (remainingSessions <= 0) continue;

        pendingItems.push({
          type: "SESSION",
          bookingType: "PROGRAM",
          data: {
            programPurchaseId: purchase.id,

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

            usage: {
              totalSessions: purchase.totalSessions,
              usedSessions: purchase.usedSessions,
              remainingSessions,
            },

            validFrom: purchase.validFrom,
            validTill: purchase.validTill,

            canBookSlot: true,
            createdAt: purchase.createdAt,
          },
        });
      }

      return pendingItems;
    } catch (error) {
      if (error instanceof ApiError) throw new ApiError(error.statusCode, error.message);
      throw error;
    }
  },

  async getUpcoming7DaysBookings(clientId: string) {
    try {
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { id: clientId },
        select: { aiSummary: true, userId: true },
      });

      const latestAssessment = clientProfile
        ? await prisma.clientAssesment.findFirst({
            where: { userId: clientProfile.userId },
            orderBy: { createdAt: "desc" },
          })
        : null;

      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const bookings = await prisma.booking.findMany({
        where: {
          clientId,
          status: "CONFIRMED",
          isActive: true,
          startDateTime: {
            gte: now,
            lte: in7Days,
          },
        },
        include: {
          therapist: {
            select: {
              id: true,
              professionalTitle: true,
              slug: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profilePhoto: true,
                  email: true,
                },
              },
            },
          },
          slot: {
            select: {
              id: true,
              startDateTime: true,
              endDateTime: true,
            },
          },
          programPurchase: {
            select: {
              id: true,
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
                },
              },
            },
          },
        },
        orderBy: {
          startDateTime: "asc",
        },
      });

      return bookings.map((b) => {
        const permissions = clientBookingPermission(
          b.startDateTime,
          b.endDateTime,
          b.hasClientRescheduledEarlier,
          b.rescheduleStatus || ""
        );
        const canCancel = getClientBookingPermissions(b.startDateTime).canCancel;

        return {
          id: b.id,
          bookingType: b.bookingType,
          startDateTime: b.startDateTime,
          endDateTime: b.endDateTime,
          meetingLink: permissions.canJoinSession ? b.meetingLink : null,
          actualMeetingLink: b.meetingLink,
          flags: {
            canJoin: permissions.canJoinSession,
            canReschedule: permissions.canReschedule,
            canCancel,
            hasClientRescheduledEarlier: b.hasClientRescheduledEarlier,
            rescheduleStatus: permissions.rescheduleStatus,
          },
          therapist: {
            id: b.therapist.id,
            name: `${b.therapist.user.firstName} ${b.therapist.user.lastName}`.trim(),
            profilePhoto: b.therapist.user.profilePhoto,
            professionalTitle: b.therapist.professionalTitle,
            slug: b.therapist.slug,
          },
          program: b.programPurchase
            ? {
                id: b.programPurchase.program.id,
                title: b.programPurchase.program.title,
                planName: b.programPurchase.programPlan.name,
              }
            : null,
          createdAt: b.createdAt,
          coverSummary: clientProfile?.aiSummary || null,
          intakeForm: latestAssessment || null,
          message: b.sessionNotes || null,
          homework: b.homework || null,
        };
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, (error as Error).message || "Error fetching upcoming bookings");
    }
  },
  async updateBookingNotes(bookingId: string, clientId: string, sessionNotes: string) {
    try {
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          clientId,
          status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
        },
      });

      if (!booking) {
        throw new ApiError(404, "Booking not found");
      }

      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { sessionNotes: sessionNotes || null },
      });

      aiService
        .refreshClientAiSummary(clientId)
        .catch((err) => console.error("Error refreshing AI summary on booking note update:", err));

      return updated;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, (error as Error).message || "Failed to update booking notes");
    }
  },
  async submitSessionIntake(
    userId: string,
    clientId: string,
    bookingId: string,
    data: { assessment?: any; message?: string }
  ) {
    try {
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          clientId,
        },
      });

      if (!booking) {
        throw new ApiError(404, "Booking not found");
      }

      let newAssessment = null;
      if (data.assessment && Object.keys(data.assessment).length > 0) {
        newAssessment = await prisma.clientAssesment.create({
          data: {
            ...data.assessment,
            userId,
          },
        });
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          sessionNotes: data.message || undefined,
        },
      });

      aiService
        .refreshClientAiSummary(clientId)
        .catch((err) =>
          console.error("Error refreshing AI summary on session intake submission:", err)
        );

      return {
        success: true,
        assessment: newAssessment,
        booking: updatedBooking,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, (error as Error).message || "Failed to submit session intake");
    }
  },
};

export const clientBookingPermission = (
  startDateTime: Date,
  endDateTime: Date,
  hasClientRescheduledEarlier: boolean,
  rescheduleStatus: string
) => {
  const now = new Date();

  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  // 15 minutes before start
  const joinWindowStart = new Date(start.getTime() - 15 * 60 * 1000);

  const response = {
    canJoinSession: false,
    canReschedule: false,
    rescheduleStatus: bookingRescheduleStatus(rescheduleStatus),
  };

  // Can join only between (start - 15 mins) and end time
  // if (now >= joinWindowStart && now <= end && rescheduleStatus ! == 'REQUESTED') {
  //   response.canJoinSession = true;
  // }

  if (now >= joinWindowStart && now <= end && rescheduleStatus !== "REQUESTED") {
    response.canJoinSession = true;
  }

  // Optional: reschedule allowed only BEFORE join window starts
  if (clientReschedulePermission(startDateTime, hasClientRescheduledEarlier)) {
    response.canReschedule = true;
  }

  return response;
};

export const clientReschedulePermission = (
  startDateTime: Date,
  hasClientRescheduledEarlier: boolean
): boolean => {
  // Rule: only one reschedule allowed
  if (hasClientRescheduledEarlier) {
    return false;
  }

  const now = new Date();

  const diffInMs = startDateTime.getTime() - now.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  // Rule: less than 12 hours → no reschedule
  if (diffInHours < 12) {
    return false;
  }

  // 12+ hours remaining → reschedule allowed
  return true;
};

export const bookingRescheduleStatus = (rescheduleStatus: string) => {
  return {
    status: rescheduleStatus,
    message:
      rescheduleStatus === "REQUESTED"
        ? "Reschedule request is pending approval"
        : rescheduleStatus === "APPROVED"
          ? "Reschedule request has been approved by Admin"
          : rescheduleStatus === "REJECTED"
            ? "Reschedule request has been rejected by Admin"
            : "",
  };
};
