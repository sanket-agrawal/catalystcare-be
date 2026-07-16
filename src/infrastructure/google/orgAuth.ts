import { google } from "googleapis";

const clientId = process.env.GOOGLE_CLIENT_ID as string;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET as string;

/**
 * Returns a fresh OAuth2Client authenticated with the organizational
 * Google account's (techadmin@catalystcare.in) refresh token.
 *
 * Used for all Google Meet / Calendar event creation.
 * Eliminates per-therapist OAuth token management.
 */
export function getOrgAuthClient() {
  const orgRefreshToken = process.env.GOOGLE_MEET_REFRESH_TOKEN?.trim();

  if (!orgRefreshToken) {
    throw new Error(
      "GOOGLE_MEET_REFRESH_TOKEN is not configured. " +
        "Run: npx ts-node scripts/setup-org-google-token.ts"
    );
  }

  const authClient = new google.auth.OAuth2(clientId, clientSecret);
  authClient.setCredentials({
    refresh_token: orgRefreshToken,
  });

  return authClient;
}
