import ApiError from "../../../../shared/utils/ApiError";
import { prisma } from "../../../../infrastructure/prisma/client";
import { Prisma } from "@prisma/client";
import { emailQueue, meetingQueue } from "../../../../infrastructure/queues";
import { emailFromAddress, emailSubjects } from "../../../../shared/config/email.config";
import { clientBookingRescheduledTemplate, therapistBookingRescheduledTemplate, therapistRescheduleRequestRejectedTemplate } from "../../../../shared/email-templates/reschedule-booking";

const AdminSessionService = {

fetchRescheduleRequests : async () => {
return prisma.booking.findMany({
    where : {
      OR : [
         {rescheduleStatus : "REQUESTED"},
         { rescheduleStatus : "APPROVED"},
         { rescheduleStatus : "REJECTED"}
      ],
    },
    include : {
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
processRescheduleRequest : async (bookingId : string , newSlotId : string, adminId : string, action : boolean) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include : {
      client : {
        select : {
          user : {
            select : {
              firstName : true,
              lastName : true,
              email : true
            }
          }
        }
      },
            therapist : {
        select : {
          user : {
            select : {
              firstName : true,
              lastName : true,
              email : true
            }
          }
        }
      }
    }
  });

  if(!booking){
    throw new ApiError(404,'Booking not found');
  }

  if (booking.rescheduleStatus !== "REQUESTED") {
    throw new ApiError(400,"Invalid reschedule request");
  }

  const therapistFullName = booking.therapist.user.firstName+" "+booking.therapist.user.lastName;
  const clientFullName = booking.client.user.firstName+" "+booking.client.user.lastName;

   const sessionDate = booking.startDateTime.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const sessionTime = booking.startDateTime.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  });

    const therapistIntegration = await prisma.therapistProfile.findUnique({
      where: { id: booking.therapistId },
    });

  if(action){

      const newSlot = await prisma.availabilitySlot.findUnique({
    where: { id: newSlotId },
  });

  if (!newSlot || newSlot.status !== "AVAILABLE") {
    throw new ApiError(404,"Slot not available");
  }

   if (newSlot.id === booking.slotId) {
    throw new ApiError(400, "New slot cannot be same as current slot");
  }
  await prisma.$transaction(async (tx : Prisma.TransactionClient) => {
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
        hasTherapistRescheduledEarlier : true
      },
    });

    // 3. Block new slot
    await tx.availabilitySlot.update({
      where: { id: newSlotId },
      data: { status: "BOOKED" },
    });
  });


    // await emailQueue.add("rescheduleSessionConfirmationClient", {
    //   to: booking.client.user.email,
    //   subject: emailSubjects(therapistFullName, clientFullName).rescheduleSessionConfirmationClient,
    //   html: clientBookingRescheduledTemplate(
    //     booking.client.user.firstName,
    //     therapistFullName,
    //     sessionDate,
    //     sessionTime,
    //     booking.meetingLink!
    //   ),
    //   sender: emailFromAddress().infoEmail,
    // });
  
    // // Enqueue email to therapist
    // await emailQueue.add("rescheduleSessionConfirmationTherapist", {
    //   to: booking.therapist.user.email ?? therapistIntegration.googleEmail ?? "",
    //   subject: emailSubjects(therapistFullName, clientFullName).rescheduleSessionConfirmationTherapist,
    //   html: therapistBookingRescheduledTemplate(
    //     booking.therapist.user.firstName,
    //     clientFullName,
    //     sessionDate,
    //     sessionTime,
    //     booking.meetingLink!
    //   ),
    //   sender: emailFromAddress().infoEmail,
    // });

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


  return { success: true };
  }else{
       await prisma.booking.update({
    where: { id: bookingId },
    data: {
      rescheduleStatus: "REJECTED",
      rescheduleReviewedBy: adminId,
      rescheduleReviewedAt: new Date(),
    },
  });

  await emailQueue.add("rescheduleSessionRejectionClient", {
      to: booking.therapist.user.email,
      subject: emailSubjects().rescheduleSessionRejectionClient,
      html: therapistRescheduleRequestRejectedTemplate(
        booking.client.user.firstName,
        therapistFullName,
        sessionDate,
        sessionTime,
      ),
      sender: emailFromAddress().infoEmail,
    });

  return { success: true };
  }


}

};

export default AdminSessionService;