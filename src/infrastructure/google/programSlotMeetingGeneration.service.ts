import { google } from "googleapis";
import {prisma} from "../prisma/client";
import { oauth2Client } from "./index";
import { v4 as uuid } from "uuid";
import { emailFromAddress, emailSubjects } from "../../shared/config/email.config";
import { clientBookingConfirmationTemplate, therapistBookingConfirmationTemplate } from "../../shared/email-templates/booking";
import { emailQueue } from "../queues/index";
import { clientBookingRescheduledTemplate, therapistBookingRescheduledTemplate } from "../../shared/email-templates/reschedule-booking";

interface CreateMeetPayload {
  bookingId: string;
}



// export async function updateGoogleCalendarEvent(payload: CreateMeetPayload) {
//   const booking = await prisma.booking.findUnique({
//     where: { id: payload.bookingId },
//     include: {
//       therapist: {include : {user : true}},
//       client: { include: { user: true } },
//     },
//   });

//   if(!booking){
//     throw new Error("Booking not found");
//   }

//   if (!booking.calendarEventId) {
//   // fallback → create event
//   await createGoogleMeetForBooking({ bookingId: payload.bookingId });
//   return;
// }

//   const therapistIntegration = await prisma.therapistProfile.findUnique({
//     where: { id: booking.therapistId },
//   });

//   if (!therapistIntegration) return;

//   oauth2Client.setCredentials({
//     access_token: therapistIntegration.accessToken,
//     refresh_token: therapistIntegration.refreshToken,
//   });

//   const calendar = google.calendar({ version: "v3", auth: oauth2Client });

//   const calendarId = therapistIntegration.calendarId ?? "primary";


//   await calendar.events.patch({
//     calendarId,
//     eventId: booking.calendarEventId,
//     sendUpdates: "none", // notify both
//     requestBody: {
//       start: { dateTime: booking.startDateTime.toISOString() },
//       end: { dateTime: booking.endDateTime.toISOString() },
//       summary: `Catalystcare Therapy session with ${booking.client.user.firstName} ${booking.client.user.lastName}`,
//     },
//   });

//      const therapistFullName = `${booking.therapist.user.firstName} ${booking.therapist.user.lastName}`;
//   const clientFullName = `${booking.client.user.firstName} ${booking.client.user.lastName}`;

//       const sessionDate = booking.startDateTime.toLocaleDateString("en-IN", {
//     timeZone: "Asia/Kolkata",
//     weekday: "short",
//     year: "numeric",
//     month: "short",
//     day: "numeric",
//   });

//   const sessionTime = booking.startDateTime.toLocaleTimeString("en-IN", {
//     timeZone: "Asia/Kolkata",
//     hour: "2-digit",
//     minute: "2-digit",
//   });

//      await emailQueue.add("rescheduleSessionConfirmationClient", {
//     to: booking.client.user.email,
//     subject: emailSubjects(therapistFullName, clientFullName).rescheduleSessionConfirmationClient,
//     html: clientBookingRescheduledTemplate(
//       booking.client.user.firstName,
//       therapistFullName,
//       sessionDate,
//       sessionTime,
//       booking.meetingLink!
//     ),
//     sender: emailFromAddress().infoEmail,
//   });

//   // Enqueue email to therapist
//   await emailQueue.add("rescheduleSessionConfirmationTherapist", {
//     to: booking.therapist.user.email ?? therapistIntegration.googleEmail ?? "",
//     subject: emailSubjects(therapistFullName, clientFullName).rescheduleSessionConfirmationTherapist,
//     html: therapistBookingRescheduledTemplate(
//       booking.therapist.user.firstName,
//       clientFullName,
//       sessionDate,
//       sessionTime,
//       booking.meetingLink!
//     ),
//     sender: emailFromAddress().infoEmail,
//   });
// }

// export async function deleteGoogleCalendarEvent(
//   payload: CreateMeetPayload
// ): Promise<void> {
//   const booking = await prisma.booking.findUnique({
//     where: { id: payload.bookingId },
//   });

//   if (!booking) return;

//   // No calendar event → nothing to delete
//   if (!booking.calendarEventId) return;

//   const therapistIntegration = await prisma.therapistProfile.findUnique({
//     where: { id: booking.therapistId },
//   });

//   if (!therapistIntegration) return;

//   oauth2Client.setCredentials({
//     access_token: therapistIntegration.accessToken,
//     refresh_token: therapistIntegration.refreshToken,
//   });

//   const calendar = google.calendar({ version: "v3", auth: oauth2Client });

//   const calendarId = therapistIntegration.calendarId || "primary";

//   try {
//     await calendar.events.delete({
//       calendarId,
//       eventId: booking.calendarEventId,
//       sendUpdates: "none", // notify therapist + client
//     });

//     // Clean up booking fields (important)
//     await prisma.booking.update({
//       where: { id: booking.id },
//       data: {
//         calendarEventId: null,
//         meetingLink: null,
//         meetingProvider: null,
//       },
//     });
//   } catch (error: any) {
//     /**
//      * Google error codes:
//      * 404 → event already deleted (safe to ignore)
//      * 410 → gone (safe to ignore)
//      */
//     if (error?.code === 404 || error?.code === 410) {
//       await prisma.booking.update({
//         where: { id: booking.id },
//         data: {
//           calendarEventId: null,
//           meetingLink: null,
//           meetingProvider: null,
//         },
//       });
//       return;
//     }

//     throw error; // retry via BullMQ
//   }
// }

