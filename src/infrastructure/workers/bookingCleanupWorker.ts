import { Worker } from "bullmq";
import { redisConnection } from "../redis/index";
import { prisma } from "../prisma/client";

export const bookingCleanupWorker = new Worker(
  "bookingCleanupQueue",
  async (job) => {
    const { bookingId, slotId } = job.data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    // Only cancel if still pending payment
    if (!booking || booking.status !== "PENDING_PAYMENT") {
      return;
    }

    console.log(`⏰ Cancelling unpaid booking ${bookingId}`);

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        paymentStatus: "FAILED",
      },
    });

    await prisma.availabilitySlot.update({
      where: { id: slotId },
      data: { status: "AVAILABLE" },
    });

    console.log(`✅ Slot ${slotId} unblocked`);
  },
  { connection: redisConnection }
);
