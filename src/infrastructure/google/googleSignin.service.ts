// src/modules/auth/googleSignIn.service.ts

import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client";
import ApiError from "../../shared/utils/ApiError";
import { emailFromAddress, emailSubjects } from "../../shared/config/email.config";
import { welcomeEmailTemplate } from "../../shared/email-templates/auth";
import { emailQueue } from "../../infrastructure/queues";
import { OAuth2Client } from "google-auth-library";

export const googleAuthClient = new OAuth2Client(
  process.env.GOOGLE_AUTH_CLIENT_ID
);



export const googleSignInService = async ( idToken: string) => {
  // 1. Verify Google ID token

    let isClientProfileFilled = false;
let isTherapistProfileFilled = false;
let therapistProfileId =  null;
let clientProfileId = null;

  const ticket = await googleAuthClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload?.email || !payload.sub) {
    throw new ApiError(400, "Invalid Google token");
  }

  const email = payload.email.toLowerCase();

  // 2. Find user by email
  let user = await prisma.user.findUnique({
    where: { email },
    include: {
      clientProfile: true,
      therapistProfile: true,
    },
  });

  // 3. Existing user → login
  if (user) {
    // Security: block admin Google login
    if (user.role === "ADMIN") {
      throw new ApiError(403, "Admin login via Google is not allowed");
    }

    // Attach Google identity if missing
    if (!user.googleAuthId) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          googleAuthId: payload.sub,
          googleEmail: payload.email,
          authProvider: user.password ? "HYBRID" : "GOOGLE",
          profilePhoto: user.profilePhoto ? user.profilePhoto :  ( payload.picture ? payload.picture : null ),
        },
      });
    }

    user = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
      include: {
        clientProfile: true,
        therapistProfile: true,
      },
    });

    if (user.role === "CLIENT") {
      const clientProfile = await prisma.clientProfile.findUnique({ where: { userId: user.id } });
      isClientProfileFilled = !!clientProfile;
      clientProfileId = clientProfile ? clientProfile.id : null
    }
    
    if (user.role === "THERAPIST") {
      const therapistProfile = await prisma.therapistProfile.findUnique({ where: { userId: user.id } });
    
      isTherapistProfileFilled = !!therapistProfile;
      therapistProfileId = therapistProfile ? therapistProfile.id : null
    }

      const token = jwt.sign(
        { id: user.id, email: user.email, phone : user.mobileNumber ,role: user.role, firstName : user.firstName, lastName : user.lastName, profilePhoto : user.profilePhoto, therapistProfileId, clientProfileId },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
      );

    return {token, user};
  }

  // 4. New user → always CLIENT
  user = await prisma.user.create({
    data: {
      email,
      firstName: payload.given_name ?? "User",
      lastName: payload.family_name ?? "",
      googleAuthId: payload.sub,
      googleEmail: payload.email,
      profilePhoto: payload.picture,
      authProvider: "GOOGLE",
      isEmailVerified: true,
      role: "CLIENT",
    },
  });

  const clientProfile = await prisma.clientProfile.create({
    data: { userId: user.id },
  });

  user = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: {
      clientProfile: true,
      therapistProfile: true,
    },
  });

   const token = jwt.sign(
        {
          id: user.id,
          firstName : user.firstName,
          lastName : user.lastName,
          email: user.email,
          phone: user.mobileNumber,
          role: user.role,
          clientProfileId : clientProfile ? clientProfile.id : null
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
      );
  
      await emailQueue.add('clientWelcome',{
        to : email,
        subject : emailSubjects().welcome,
        html : welcomeEmailTemplate(user.firstName),
        sender : emailFromAddress().otpVerification
      });


  return {token, user};
};
