import ApiError from "../../../shared/utils/ApiError"
import { authenticatedUser } from "../user/user.types"
import {prisma} from '../../../infrastructure/prisma/client'
import { ClientProfileUpdateData, CreateAssessmentInput } from "./client.dto"
import { Prisma } from "@prisma/client"
import { getClientBookingPermissions } from "./client.helper"
import { meetingQueue } from "../../../infrastructure/queues"
import { canRateSession } from "../../../shared/lib/ratings"

type BookingForClientList = {
  id: string;
  endDateTime: Date;
  testimonial: {
    rating: number;
    status: string;
  } | null;
};

                                 
export const clientService = {

    async profileUpdate(user : authenticatedUser, data : ClientProfileUpdateData){
        try {

            const existingProfile = await prisma.clientProfile.findUnique({
                where : {
                    id : user.id
                }
            });

            let updatedProfile

            if(existingProfile){
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
            }else{
               updatedProfile  = await prisma.clientProfile.create({
                    data : {
                        userId : user.id,
                        ageGroup : data.ageGroup,
                        genderIdentity : data.genderIdentity,
                        occupation : data.occupation,
                        seekingSupportFor : data.seekingSupportFor,
                        relationShipStatus : data.relationShipStatus
                    }
                })
            }


            return updatedProfile;

        } catch (error) {
            if(error instanceof ApiError){
                throw new ApiError(error.statusCode,error.message)
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
      const fieldCategoryMap: Record<
        string,
        { category: string; subCategory: string }
      > = {
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

      const categoryNames = [
        ...new Set(activeMappings.map((m) => m.category)),
      ];
      const subCategoryNames = [
        ...new Set(activeMappings.map((m) => m.subCategory)),
      ];

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
  async getTherapistByUserNeeds(user : authenticatedUser, assessmentId : string){
        try{

        }catch(error){
            if(error instanceof ApiError){
                throw new ApiError(error.statusCode,error.message)
            }
            throw error;
        }
    },
    async fetchBookings(clientId : string){
     try{
        const bookings = await prisma.booking.findMany({
          where : {
            clientId : clientId,
             paymentStatus: "CAPTURED",
             status: "CONFIRMED",
          },
          include : {
            therapist: {
               select : {
                id : true,
                user : {
                  select : {
                    firstName : true,
                    lastName : true,
                    profilePhoto : true
                  }
                }
               }
             },
             testimonial : {
              select: {
            rating: true,
            status: true
          }
             }
          },
          orderBy : {
            updatedAt : 'desc'
          }
        });

        // return bookings;
        return bookings.map(booking => {
       const permission =  clientBookingPermission(booking.startDateTime, booking.endDateTime);
        return  {
          ...booking,
        hasRated: !!booking.testimonial,
      canRate:
        !booking.testimonial &&
        new Date() > booking.endDateTime,
        // permissions: getClientBookingPermissions(booking.startDateTime),
        canJoinSession : permission.canJoinSession,
        canReschedule : permission.canReschedule
      };
      });
     }catch(error){
       if(error instanceof ApiError){
                throw new ApiError(error.statusCode,error.message)
            }
            throw error;
     }
    },
    async rescheduleTherapySession (bookingId : string, newSlotId : string,clientId : String, reason? : string){
      try{
          return prisma.$transaction(async (tx : Prisma.TransactionClient) => {
              const booking = await tx.booking.findUnique({
                where: { id: bookingId },
                include: { slot: true },
              });

              if (!booking || !booking.isActive) {
                throw new ApiError(404, "Booking not found");
              }

              if (booking.clientId !== clientId) {
                throw new ApiError(403, "Unauthorized");
              }

              if (booking.status !== "CONFIRMED") {
                throw new ApiError(400, "Only confirmed bookings can be rescheduled");
              }

              const permissions = getClientBookingPermissions(booking.startDateTime);
              if (!permissions.canReschedule) {
                throw new ApiError(400, "Rescheduling not allowed within 12 hours");
              }

              const newSlot = await tx.availabilitySlot.findUnique({
              where: { id: newSlotId },
                });

                if (!newSlot || newSlot.status !== "AVAILABLE") {
                  throw new ApiError(400, "Selected slot is not available");
                }

                // 1️⃣ Free old slot
                await tx.availabilitySlot.update({
                  where: { id: booking.slotId },
                  data: {
                    status: "AVAILABLE",
                    clientId: null,
                  },
                });

                    // 2️⃣ Book new slot
              await tx.availabilitySlot.update({
                where: { id: newSlotId },
                data: {
                  status: "BOOKED",
                  clientId: booking.clientId,
                },
              });

                  const updatedBooking = await tx.booking.update({
                  where: { id: bookingId },
                  data: {
                    slotId: newSlotId,
                    startDateTime: newSlot.startDateTime,
                    endDateTime: newSlot.endDateTime,
                    rescheduledFromId: booking.slotId,
                    rescheduledAt: new Date(),
                    meetingLink: null,
                    calendarEventId: null,
                  },
                });

                      await meetingQueue.add(
                    "update-google-meet",
                    { bookingId },
                    {
                      attempts: 5,
                      backoff: {
                        type: "exponential",
                        delay: 10_000,
                      },
                      removeOnComplete: false,
                      removeOnFail: false,
                    }
                  ); 

                return updatedBooking;


          })
      }catch(error){
         if(error instanceof ApiError){
                throw new ApiError(error.statusCode,error.message)
            }
            throw error;
      }
    }, 
    async cancelTherapySession (clientId : string, bookingId : string, reason? : string){
      try{
        return prisma.$transaction(async (tx : Prisma.TransactionClient) => {
          const booking = await tx.booking.findUnique({
            where: { id: bookingId },
          });

          if (!booking || !booking.isActive) {
            throw new ApiError(404, "Booking not found");
          }

          if (booking.clientId !== clientId) {
            throw new ApiError(403, "Unauthorized");
          }

          const permissions = getClientBookingPermissions(booking.startDateTime);
          if (!permissions.canCancel) {
            throw new ApiError(400, "Cancellation not allowed within 24 hours");
          }

          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: "CANCELLED",
              cancelledBy: "CLIENT",
              cancelledAt: new Date(),
              cancellationReason: reason,
              isActive: false,
            },
          });

          await tx.availabilitySlot.update({
            where: { id: booking.slotId },
            data: {
              status: "AVAILABLE",
              clientId: null,
            },
          });

          await meetingQueue.add(
            "delete-google-calendar-event",
            { bookingId },
            {
              attempts: 5,
              backoff: {
                type: "exponential",
                delay: 10_000,
              },
              removeOnComplete: false,
              removeOnFail: false,
            }
          );
        });
      }catch(error){
               if(error instanceof ApiError){
                throw new ApiError(error.statusCode,error.message)
            }
            throw error;
      }
    },
    async clientPendingActionList (clientId : string){
      try{

      }catch(error){
          if(error instanceof ApiError){
            throw new ApiError(error.statusCode,error.message)
          }else{
            throw error;
          }
      }
    } ,
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
        AND: [
          { startDateTime: { lte: next15Min } },
          { endDateTime: { gt: now } },
        ],
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
        singleBooking.endDateTime
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

          meetingLink: permission.canJoinSession
            ? singleBooking.meetingLink
            : null,

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
      const remainingSessions =
        purchase.totalSessions - purchase.usedSessions;

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
            name:
              purchase.therapist.user.firstName +
              " " +
              purchase.therapist.user.lastName,
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
    if (error instanceof ApiError)
      throw new ApiError(error.statusCode, error.message);
    throw error;
  }
}

}



const clientBookingPermission = (startDateTime : Date, endDateTime : Date) => {
  const now = new Date();

  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  // 15 minutes before start
  const joinWindowStart = new Date(start.getTime() - 15 * 60 * 1000);

  const response = {
    canJoinSession: false,
    canReschedule: false,
  };

  // Can join only between (start - 15 mins) and end time
  if (now >= joinWindowStart && now <= end) {
    response.canJoinSession = true;
  }

  // Optional: reschedule allowed only BEFORE join window starts
  // if (now < joinWindowStart) {
  //   response.canReschedule = true;
  // }

  return response;
};