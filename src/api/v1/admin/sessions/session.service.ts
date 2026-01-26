import { prisma } from "../../../../infrastructure/prisma/client";

const AdminSessionService = {

fetchRescheduleRequests : async () => {
return prisma.booking.findMany({
    where : { rescheduleStatus : "REQUESTED" },
    include : {
        therapist : {
            select : {
                user : {
                    select : {
                        firstName : true,
                        lastName : true
                    }
                }
            }
        },
         client : {
            select : {
                user : {
                    select : {
                        firstName : true,
                        lastName : true
                    }
                }
            }
        }
    },
    orderBy : { rescheduledAt : "desc" }
})
},
processRescheduleRequest : async (bookingId : string , newSlotId : string, adminId : string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking || booking.rescheduleStatus !== "REQUESTED") {
    throw new Error("Invalid reschedule request");
  }

  const newSlot = await prisma.availabilitySlot.findUnique({
    where: { id: newSlotId },
  });

  if (!newSlot || newSlot.status !== "AVAILABLE") {
    throw new Error("Slot not available");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Free old slot
    await tx.availabilitySlot.update({
      where: { id: booking.slotId },
      data: { status: "AVAILABLE" },
    });

    // 2. Assign new slot
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        slotId: newSlotId,
        startDateTime: newSlot.startDateTime,
        endDateTime: newSlot.endDateTime,

        rescheduleStatus: "APPROVED",
        rescheduleReviewedBy: adminId,
        rescheduleReviewedAt: new Date(),

        hasTherapistRescheduledEarlier: true,
      },
    });

    // 3. Block new slot
    await tx.availabilitySlot.update({
      where: { id: newSlotId },
      data: { status: "BOOKED" },
    });
  });

  return { success: true };
}

};

export default AdminSessionService;