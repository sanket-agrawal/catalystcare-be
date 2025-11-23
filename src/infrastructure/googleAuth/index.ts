import { google } from "googleapis";

const clientId = process.env.GOOGLE_CLIENT_ID as string;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET as string;
const redirectUri = process.env.GOOGLE_REDIRECT_URI as string;

if (!clientId || !clientSecret || !redirectUri) {
  throw new Error("Google OAuth env vars are missing");
}

export const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

export const CALENDAR_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events",
];
