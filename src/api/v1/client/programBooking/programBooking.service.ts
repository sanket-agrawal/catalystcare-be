import ApiError from "../../../../shared/utils/ApiError";
import { prisma } from "../../../../infrastructure/prisma/client";
import { Prisma } from "@prisma/client";
import { ProgramPurchaseDb, ProgramPurchaseMapped } from "./programBooking.dto";
import { meetingQueue } from "../../../../infrastructure/queues";
import { clientBookingPermission } from "../client.service";


export const programBookingService = {
  fetchProgramPurchases: async (userId: string) => {
  const now = new Date();

  const purchases= await prisma.programPurchase.findMany({
    where: { clientId: userId },
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
  })

   return purchases.map((purchase) => {
    const remainingSessions =
      purchase.totalSessions - purchase.usedSessions;

    const canBookSlot =
      purchase.status === "ACTIVE" &&
      remainingSessions > 0 &&
      (!purchase.validTill || purchase.validTill >= now);

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
        name:
          purchase.therapist.user.firstName +
          " " +
          purchase.therapist.user.lastName,
        slug : purchase.therapist.slug
      },

      client: {
        id: purchase.client.id,
        name:
          purchase.client.user.firstName +
          " " +
          purchase.client.user.lastName,
      },

      usage: {
        totalSessions: purchase.totalSessions,
        usedSessions: purchase.usedSessions,
        remainingSessions,
      },

      status: purchase.status,
      validFrom: purchase.validFrom,
      validTill: purchase.validTill,

      canBookSlot,

      createdAt: purchase.createdAt,
    };
  });
},

  bookSlot: async (
    clientId: string,
    programPurchaseId: string,
    slotId: string
  ) => {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const purchase = await tx.programPurchase.findUnique({
        where: { id: programPurchaseId },
      });

      if (!purchase || purchase.clientId !== clientId) {
        throw new ApiError(403, "Unauthorized program access");
      }

      if (purchase.status !== "ACTIVE") {
        throw new ApiError(400, "Program not active");
      }

      if (purchase.usedSessions >= purchase.totalSessions) {
        throw new ApiError(400, "No sessions left");
      }

      const slot = await tx.availabilitySlot.findUnique({
        where: { id: slotId },
      });

      if (!slot || slot.status !== "AVAILABLE") {
        throw new ApiError(400, "Slot unavailable");
      }

      await tx.availabilitySlot.update({
        where: { id: slotId },
        data: { status: "BOOKED" },
      });

      const booking = await tx.booking.create({
        data: {
          clientId,
          therapistId: purchase.therapistId,
          slotId,
          startDateTime: slot.startDateTime,
          endDateTime: slot.endDateTime,
          status: "CONFIRMED",
          bookingType: "PROGRAM",
          programPurchaseId,
          isActive: true,
        },
      });

      const updated = await tx.programPurchase.update({
        where: { id: programPurchaseId },
        data: { usedSessions: { increment: 1 } },
        include : {program : true, programPlan : true}
      });

      if (updated.usedSessions >= updated.totalSessions) {
        await tx.programPurchase.update({
          where: { id: programPurchaseId },
          data: { status: "EXHAUSTED" },
        });
      }

      meetingQueue.add('program-slot-google-meeting-queue',
        { bookingId : booking.id,
          programTitle : updated.program.title,
          planName : updated.programPlan.name,
          sessionNumber : updated.usedSessions
         },
    {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 10_000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    }
      )

      return booking;
    });
  },
  cancel: async (bookingId: string, cancelledBy: string) => {
    return prisma.$transaction(async (tx : Prisma.TransactionClient) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) throw new ApiError(404, "Booking not found");

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelledBy,
        },
      });

      await tx.availabilitySlot.update({
        where: { id: booking.slotId },
        data: { status: "AVAILABLE" },
      });

      if (booking.bookingType === "PROGRAM" && booking.programPurchaseId) {
        await tx.programPurchase.update({
          where: { id: booking.programPurchaseId },
          data: {
            usedSessions: { decrement: 1 },
            status: "ACTIVE",
          },
        });
      }

      return true;
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
      hasClientRescheduledEarlier : true,
      rescheduleStatus : true,
      programPurchase: {
        select: {
          program: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          programPlan : {
            select : {
              name : true
            }
          },
          therapist : {
            select : {
              slug : true,
              user : {
                select : {
firstName : true,
                lastName : true
                }
                
              }
            }
          },
          totalSessions : true,
          usedSessions : true,
          createdAt : true
        },
      },
    },
    orderBy : { createdAt : 'desc'}
  });

  return bookings.map(booking => {
    const permissions  = clientBookingPermission(booking.startDateTime,booking.endDateTime,booking.hasClientRescheduledEarlier,booking.rescheduleStatus)
    return {
      ...booking,
      meetingLink : permissions.canJoinSession ? booking.meetingLink : null,
      canJoinSession : permissions.canJoinSession,
      canReschedule : permissions.canReschedule
    }
  });
}

};
