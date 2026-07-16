import { google } from "googleapis";
import * as dotenv from "dotenv";
import * as readline from "readline";

// Load environment variables
dotenv.config();

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;

if (!clientId || !clientSecret || !redirectUri) {
  console.error(
    "Error: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REDIRECT_URI is missing in .env"
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

const scopes = ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar.events"];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  console.log("=== Google OAuth Org Account Token Generator ===");
  console.log(
    "This script will help you generate the GOOGLE_MEET_REFRESH_TOKEN for techadmin@catalystcare.in\n"
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });

  console.log(
    "1. Open the following URL in a browser where you are logged in as techadmin@catalystcare.in:"
  );
  console.log("---------------------------------------------------------------------------------");
  console.log(authUrl);
  console.log(
    "---------------------------------------------------------------------------------\n"
  );

  console.log("2. Authorize the application and grant all permissions.");
  console.log(
    "3. After authorization, you will be redirected to a URL (which might fail to load, that is fine)."
  );
  console.log(
    "4. Copy the entire 'code' query parameter from the address bar (e.g. ?code=4/0Ad...) or paste the whole redirect URL.\n"
  );

  rl.question("Enter the authorization code or redirect URL: ", async (input) => {
    let code = input.trim();
    if (code.includes("code=")) {
      const urlObj = new URL(code.startsWith("http") ? code : `http://localhost${code}`);
      code = urlObj.searchParams.get("code") || code;
    }

    try {
      console.log("\nExchanging authorization code for tokens...");
      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.refresh_token) {
        console.error(
          "\nWarning: No refresh token returned! Ensure you clicked 'consent' and that this is the first time authorizing, or clear access in Google settings first."
        );
      }

      console.log("\nSuccess!");
      console.log("==========================================");
      console.log("Add this line to your production and local .env files:\n");
      console.log(
        `GOOGLE_MEET_REFRESH_TOKEN="${tokens.refresh_token || "ALREADY_AUTHORIZED_USE_PREVIOUS_REFRESH_TOKEN"}"`
      );
      console.log("\nAccess Token (temporary):", tokens.access_token);
      console.log("==========================================");
    } catch (err: any) {
      console.error("\nError exchanging code for tokens:", err.message);
    } finally {
      rl.close();
    }
  });
}

main();
