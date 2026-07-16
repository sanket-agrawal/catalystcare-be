import ApiError from "../../shared/utils/ApiError";
import { prisma } from "../prisma/client";

import { google } from "googleapis";
import { getOrgAuthClient } from "./orgAuth";
import { v4 as uuid } from "uuid";

interface CreateMeetPayload {
  therapistId: string;
  startTime: Date;
  endTime: Date;
  webinarTitle: string;
  webinarDescription?: string;
}

export async function createGoogleMeet(
  payload: CreateMeetPayload
): Promise<{ meetLink: string; provider: string }> {
  const therapist = await prisma.therapistProfile.findUnique({
    where: { id: payload.therapistId },
    include: { user: true },
  });

  if (!therapist) {
    throw new ApiError(
      404,
      `[createGoogleMeet] Therapist profile not found: ${payload.therapistId}`
    );
  }

  const authClient = getOrgAuthClient();
  // googleapis will auto-refresh using refresh_token if needed
  const calendar = google.calendar({ version: "v3", auth: authClient });

  const startDateTime = new Date(payload.startTime);
  const endDateTime = new Date(payload.endTime);

  const startIso = startDateTime.toISOString();
  const endIso = endDateTime.toISOString();

  const summary = `Webinar: ${payload.webinarTitle}`;
  const description = payload.webinarDescription ?? "";

  const calendarId = "primary";

  const event = await calendar.events.insert({
    calendarId,
    sendUpdates: "none",
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
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 10 }],
      },
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: false,
      attendees: [
        {
          email: therapist.user.email ?? therapist.googleEmail ?? "",
        },
      ].filter((a) => a.email),

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
  const videoEntry = entryPoints.find((e) => e.entryPointType === "video");

  const meetLink = videoEntry?.uri ?? null;
  const calendarEventId = event.data.id ?? null;

  if (!meetLink || !calendarEventId) {
    throw new ApiError(500, "[createGoogleMeet] Failed to get meet link or eventId");
  }

  return {
    meetLink,
    provider: "GOOGLE_MEET",
  };
}
