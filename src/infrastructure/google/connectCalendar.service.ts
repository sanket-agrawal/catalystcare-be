import { google } from "googleapis";
import { oauth2Client, CALENDAR_SCOPES } from "./index";
import {prisma} from "../prisma/client";
import { authenticatedUser } from "api/v1/user/user.types";
import ApiError from "../../shared/utils/ApiError";
import { therapistCalendarConnectedTemplate } from "../../shared/email-templates/calendarConnection";
import { emailQueue } from "../queues";
import { emailFromAddress, emailSubjects } from "../../shared/config/email.config";


/**
 * Step 1: Redirect therapist to Google OAuth consent screen
 */
export const connectCalendarService = {
   authenticate : async (user : authenticatedUser) => {
   try{
      const state = JSON.stringify({
      userId: user.id,
      ts: Date.now(),
    });

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: CALENDAR_SCOPES,
      state,
    });

    return url;
    }catch(error){
       if(error instanceof ApiError) throw new ApiError(error.statusCode,error.message)
       throw error;
    }
  },

    callback : async (code : string, state : string) => {
    try {

      if(!code || !state){
        throw new ApiError(400,"Missing code or state in Google OAuth callback");
      }

      const parsedState = JSON.parse(state) as { userId: string; ts: number };
      const userId = parsedState.userId;

      // You might want to verify state timestamp or match session user, etc.

      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.access_token || !tokens.refresh_token) {
        throw new ApiError(400,"Failed to obtain access or refresh token from Google");
      }
    

      oauth2Client.setCredentials(tokens);

      // Get user info from Google
      const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
      const userInfoResponse = await oauth2.userinfo.get();
      const googleUser = userInfoResponse.data;

      if (!googleUser.id || !googleUser.email) {
         throw new ApiError(400,"Unable to fetch Google user info");
      }

      // Find therapistProfile by userId
      const therapist = await prisma.therapistProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!therapist) {
        throw new ApiError(400,"Therapist profile not found");
      }

      const expiryDate =
  typeof tokens.expiry_date === "number"
    ? new Date(tokens.expiry_date)
    : null;

      // Upsert therapist google calendar config
      const updatedTherapistProfile = await prisma.therapistProfile.update({
        where: { id: therapist.id },
        data: {
          googleUserId: googleUser.id,
          googleEmail: googleUser.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate,
          calendarId: "primary",
        },
        include : {user : true}
      });

      await emailQueue.add('therapistCalendarConnection',{
                        to : updatedTherapistProfile.googleEmail,
                        subject : emailSubjects().therapistCalendarConnection,
                        html : therapistCalendarConnectedTemplate(updatedTherapistProfile.user.firstName),
                        sender : emailFromAddress().onboarding
      }); 

      const redirectUrl =
        process.env.FRONTEND_DASHBOARD_URL ??
        "https://catalystcare.in/therapist-dashboard";

      return `${redirectUrl}?googleCalendarConnected=true`;
    } catch (error) {
      if(error instanceof ApiError) throw new ApiError(error.statusCode,error.message)
       throw error;
    }
  }

}
