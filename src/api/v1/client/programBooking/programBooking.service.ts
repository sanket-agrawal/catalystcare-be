import ApiError from "../../../../shared/utils/ApiError";
import { prisma } from "../../../../infrastructure/prisma/client";
import { Prisma } from "@prisma/client";
import { FetchProgramPurchasesResponse } from "./programBooking.dto";

export const programBookingService = {
  fetchProgramPurchases: async (userId: string) => {
  const now = new Date();

  const purchases = await prisma.programPurchase.findMany({
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
  });

   const response: FetchProgramPurchasesResponse[]=  purchases.map((purchase) => {
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

  return response;
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
      });

      if (updated.usedSessions + 1 >= updated.totalSessions) {
        await tx.programPurchase.update({
          where: { id: programPurchaseId },
          data: { status: "EXHAUSTED" },
        });
      }

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
};
