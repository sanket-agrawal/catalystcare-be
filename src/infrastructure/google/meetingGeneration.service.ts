import { google } from "googleapis";
import {prisma} from "../prisma/client";
import { oauth2Client } from "./index";
import { v4 as uuid } from "uuid";
import { emailFromAddress, emailSubjects } from "../../shared/config/email.config";
import { clientBookingConfirmationTemplate, therapistBookingConfirmationTemplate } from "../../shared/email-templates/booking";
import { emailQueue } from "../queues/index";

interface CreateMeetPayload {
  bookingId: string;
}

export async function createGoogleMeetForBooking(
  payload: CreateMeetPayload
): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: payload.bookingId },
    include: {
      therapist: {
        include: { user: true },
      },
      client: {
        include: { user: true },
      },
    },
  });

  if (!booking) {
    console.warn(
      `[createGoogleMeetForBooking] Booking not found: ${payload.bookingId}`
    );
    return;
  }

  if (booking.meetingLink) {
    // already created
    return;
  }

  const therapistIntegration =
    await prisma.therapistProfile.findUnique({
      where: { id: booking.therapistId },
    });

  if (!therapistIntegration) {
    console.warn(
      `[createGoogleMeetForBooking] No Google Calendar integration for therapist ${booking.therapistId}`
    );
    return;
  }

  oauth2Client.setCredentials({
    access_token: therapistIntegration.accessToken,
    refresh_token: therapistIntegration.refreshToken,
  });

  // googleapis will auto-refresh using refresh_token if needed
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const startDateTime = booking.startDateTime;
  const endDateTime = booking.endDateTime;

  const startIso = startDateTime.toISOString();
  const endIso = endDateTime.toISOString();

  const summary = `Catalystcare Therapy session with ${booking.client.user.firstName} ${booking.client.user.lastName}`;
  const description = `Therapy session with ${booking.client.user.firstName} ${booking.client.user.lastName}`;

  const calendarId = therapistIntegration.calendarId ?? "primary";

  const event = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: 1,
    requestBody: {
      summary,
      description,
      start: {
        dateTime: startIso,
      },
      end: {
        dateTime: endIso,
      },
      attendees: [
        {
          email: booking.client.user.email,
        },
      ],
      conferenceData: {
        createRequest: {
          requestId: uuid(),
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    },
  });

  const conferenceData = event.data.conferenceData;
  const entryPoints = conferenceData?.entryPoints ?? [];
  const videoEntry = entryPoints.find(
    (e) => e.entryPointType === "video"
  );

  const meetLink = videoEntry?.uri ?? null;
  const calendarEventId = event.data.id ?? null;

  if (!meetLink || !calendarEventId) {
    console.error(
      "[createGoogleMeetForBooking] Failed to get meet link or eventId"
    );
    return;
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      meetingLink: meetLink,
      calendarEventId,
      meetingProvider: "GOOGLE_MEET",
    },
  });

    const sessionDate = startDateTime.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const sessionTime = startDateTime.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  });

   const therapistFullName = `${booking.therapist.user.firstName} ${booking.therapist.user.lastName}`;
  const clientFullName = `${booking.client.user.firstName} ${booking.client.user.lastName}`;

   await emailQueue.add("bookingConfirmationClient", {
    to: booking.client.user.email,
    subject: emailSubjects().clientBookingConfirmation,
    html: clientBookingConfirmationTemplate(
      booking.client.user.firstName,
      therapistFullName,
      sessionDate,
      sessionTime,
      meetLink
    ),
    sender: emailFromAddress().infoEmail,
  });

  // Enqueue email to therapist
  await emailQueue.add("bookingConfirmationTherapist", {
    to: booking.therapist.user.email ?? therapistIntegration.googleEmail ?? "",
    subject: emailSubjects().therapistBookingConfirmation,
    html: therapistBookingConfirmationTemplate(
      booking.therapist.user.firstName,
      clientFullName,
      sessionDate,
      sessionTime,
      meetLink
    ),
    sender: emailFromAddress().infoEmail,
  });

  // Optionally enqueue email/SMS notification via your existing Bull queues
}
