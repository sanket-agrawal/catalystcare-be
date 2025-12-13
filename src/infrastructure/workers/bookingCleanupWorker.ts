import { Worker } from "bullmq";
import { redisConnection } from "../redis/index";
import { prisma } from "../prisma/client";
import { slotConfig } from "../../shared/config/slot.config";
import { Prisma } from "@prisma/client";

export const bookingCleanupWorker = new Worker(
  "bookingCleanupQueue",
  async (job) => {
    const { bookingId, slotId } = job.data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
       include: { payment: true }
    });

if (!booking || booking.status !== "PENDING_PAYMENT") {
      console.log(`⏭️  Skipping cleanup for booking ${bookingId} - status: ${booking?.status}`);
      return;
    }

    console.log(`⏰ Cancelling unpaid booking ${bookingId}`);

        await prisma.$transaction(async (tx : Prisma.TransactionClient) => {
      // ✅ Set isActive = false to release the unique constraint
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          paymentStatus: "FAILED",
          isActive: false, // ✅ This allows the slot to be booked again
          cancelledAt: new Date(),
          cancellationReason: `Payment timeout - ${slotConfig.REGAIN_AVAILABLE_SLOTS} minutes expired`,
        },
      });

      if (booking.payment) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: "FAILED" },
        });
      }

      await tx.availabilitySlot.update({
        where: { id: slotId },
        data: { status: "AVAILABLE" },
      });
    });

    console.log(`✅ Slot ${slotId} unblocked`);
  },
  { connection: redisConnection }
);
