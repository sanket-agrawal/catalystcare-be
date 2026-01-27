import ApiError from "../../../../shared/utils/ApiError";
import { prisma } from "../../../../infrastructure/prisma/client";
import { therapistReschedulePermission } from "../therapist.service";
import { emailQueue } from "../../../../infrastructure/queues";
import { emailFromAddress, therapistSessionSubjects } from "../../../../shared/config/email.config";
import { adminTherapistRescheduleRequestTemplate } from "../../../../shared/email-templates/admin";
import { therapistRescheduleRequestSubmittedTemplate } from "../../../../shared/email-templates/therapist";

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
            include : {
              therapist : {
                select : {
                  user : {
                    select : {
                      email : true,
                      firstName : true,
                      lastName : true,
                    }
                  }
                }
              },
              client : {
                select : {
                  user : {
                    select : {
                      firstName : true,
                      lastName : true,
                    }
                  }
                }
              }
            }
  });

  if (!booking) {
    throw new ApiError(400,"Booking not eligible for reschedule");
  }

  if (booking.hasTherapistRescheduledEarlier) {
    throw new ApiError(400,"Therapist has already rescheduled");
  }

  if(!therapistReschedulePermission(booking.startDateTime,booking.hasTherapistRescheduledEarlier,booking.rescheduleStatus)){
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

  const formattedDate=formatToIST(booking.startDateTime)

  await emailQueue.add('therapistRescheduleRequestAdminCopy',{
            to : 'admin@catalystcare.in',
            subject : therapistSessionSubjects().adminNotification,
            html : adminTherapistRescheduleRequestTemplate(booking.therapist.user.firstName+" "+booking.therapist.user.lastName, booking.client.user.firstName+" "+booking.client.user.lastName, formattedDate, reason),
            sender : emailFromAddress().infoEmail
          });

          await emailQueue.add('therapistRescheduleRequestTherapistCopy',{
            to : booking.therapist.user.email,
            subject : therapistSessionSubjects().therapistNotification,
            html : therapistRescheduleRequestSubmittedTemplate(booking.therapist.user.firstName+" "+booking.therapist.user.lastName, booking.client.user.firstName+" "+booking.client.user.lastName, formattedDate, reason),
            sender : emailFromAddress().infoEmail
          });

  return { message: "Reschedule request submitted successfully" };

}
}

export function formatToIST(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(new Date(date));
}

export default TherapistSessionService;