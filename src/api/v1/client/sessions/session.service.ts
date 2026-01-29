import { Prisma } from "@prisma/client";
import ApiError from "../../../../shared/utils/ApiError";
import { clientReschedulePermission } from "../client.service";
import { meetingQueue } from "../../../../infrastructure/queues";
import {prisma} from "../../../../infrastructure/prisma/client"



const ClientSessionService = {
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

                  if(booking.hasClientRescheduledEarlier){
                    throw new ApiError(400, "Rescheduling once is allowed only");
                  }

                  const permissions = clientReschedulePermission(booking.startDateTime,booking.hasClientRescheduledEarlier);
                  
                  if(!permissions){
                    throw new ApiError(400, "Rescheduling not allowed within 24 hours or reschedule limit reached");
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
                        hasClientRescheduledEarlier : true

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
        // async cancelTherapySession (clientId : string, bookingId : string, reason? : string){
        //   try{
        //     return prisma.$transaction(async (tx : Prisma.TransactionClient) => {
        //       const booking = await tx.booking.findUnique({
        //         where: { id: bookingId },
        //       });
    
        //       if (!booking || !booking.isActive) {
        //         throw new ApiError(404, "Booking not found");
        //       }
    
        //       if (booking.clientId !== clientId) {
        //         throw new ApiError(403, "Unauthorized");
        //       }
    
        //       const permissions = getClientBookingPermissions(booking.startDateTime);
        //       if (!permissions.canCancel) {
        //         throw new ApiError(400, "Cancellation not allowed within 24 hours");
        //       }
    
        //       await tx.booking.update({
        //         where: { id: bookingId },
        //         data: {
        //           status: "CANCELLED",
        //           cancelledBy: "CLIENT",
        //           cancelledAt: new Date(),
        //           cancellationReason: reason,
        //           isActive: false,
        //         },
        //       });
    
        //       await tx.availabilitySlot.update({
        //         where: { id: booking.slotId },
        //         data: {
        //           status: "AVAILABLE",
        //           clientId: null,
        //         },
        //       });
    
        //       await meetingQueue.add(
        //         "delete-google-calendar-event",
        //         { bookingId },
        //         {
        //           attempts: 5,
        //           backoff: {
        //             type: "exponential",
        //             delay: 10_000,
        //           },
        //           removeOnComplete: false,
        //           removeOnFail: false,
        //         }
        //       );
        //     });
        //   }catch(error){
        //            if(error instanceof ApiError){
        //             throw new ApiError(error.statusCode,error.message)
        //         }
        //         throw error;
        //   }
        // },
}

export default ClientSessionService;