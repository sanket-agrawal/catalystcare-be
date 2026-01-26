import ApiError from "../../../../shared/utils/ApiError";
import { prisma } from "../../../../infrastructure/prisma/client";
import { therapistReschedulePermission } from "../therapist.service";

const TherapistSessionService = {
    rescheduleSession : async (bookingId : string, therapistId : string, reason : string) => {
            const booking = await prisma.booking.findFirst({
            where: {
            id: bookingId,
            therapistId,
            status: "CONFIRMED",
            paymentStatus : 'CAPTURED',
            isActive: true,
            rescheduleStatus: null,
            },
  });

  if (!booking) {
    throw new ApiError(400,"Booking not eligible for reschedule");
  }

  if (booking.hasTherapistRescheduledEarlier) {
    throw new ApiError(400,"Therapist has already rescheduled");
  }

  if(!therapistReschedulePermission(booking.startDateTime,booking.hasTherapistRescheduledEarlier)){
     throw new ApiError(400,"Cannot reschedule within last one hour of session time");
  }

    await prisma.booking.update({
    where: { id: bookingId },
    data: {
      rescheduleStatus: "REQUESTED",
      rescheduledFromId : booking.slotId,
      rescheduledAt : new Date(),
      rescheduleReason: reason,
    },
  });

  return { message: "Reschedule request submitted successfully" };

}
}

export default TherapistSessionService;