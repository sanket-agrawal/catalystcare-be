import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../../infrastructure/prisma/client";
import ApiError from "../../../../../shared/utils/ApiError";
import { OTPService } from "../../../../../shared/utils/otp.service";
import { hashPassword } from "../../../../../shared/utils/hashPassword";
import { googleAuthClient } from "../../../../../infrastructure/google/googleSignin.service";
import { emailQueue } from "../../../../../infrastructure/queues/index";
import { emailFromAddress, emailSubjects } from "../../../../../shared/config/email.config";
import { otpVerificationTemplate, welcomeEmailTemplate } from "../../../../../shared/email-templates/auth";
import { ExtensionRegisterInput, ExtensionVerifyOTPInput, ExtensionLoginInput } from "./extension.auth.dto";

// ─── Shared JWT builder ────────────────────────────────────────────────────────
// Matches existing platform JWT structure exactly — same middleware works for both

function buildExtensionToken(params: {
  id: string;
  email: string;
  mobileNumber: string | null;
  role: string;
  firstName: string;
  lastName: string;
  profilePhoto: string | null;
  clientProfileId: string | null;
  therapistProfileId: string | null;
}) {
  return jwt.sign(
    {
      id: params.id,
      email: params.email,
      phone: params.mobileNumber,
      role: params.role,
      firstName: params.firstName,
      lastName: params.lastName,
      profilePhoto: params.profilePhoto,
      clientProfileId: params.clientProfileId,
      therapistProfileId: params.therapistProfileId,
      isExtensionUser: true,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
}

// ─── Helper: check if client profile has meaningful data ──────────────────────

function isClientProfileComplete(profile: {
  ageGroup: string | null;
  genderIdentity: string | null;
  occupation: string | null;
} | null): boolean {
  return !!(profile?.ageGroup && profile?.genderIdentity && profile?.occupation);
}

// ─── 1. Register — send OTP ───────────────────────────────────────────────────

export const extensionRegisterService = async (data: ExtensionRegisterInput) => {
  const { email, firstName, mobileNumber } = data;

  const existingByEmail = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingByEmail?.isEmailVerified) {
    throw new ApiError(409, "An account with this email already exists. Please log in.");
  }

  if (mobileNumber) {
    const existingByMobile = await prisma.user.findFirst({
      where: { mobileNumber, isEmailVerified: true },
    });
    if (existingByMobile) {
      throw new ApiError(409, "Mobile number already registered.");
    }
  }

  const otp = await OTPService.generateOTP(email);
  await emailQueue.add("sendOtp", {
    to: email,
    subject: emailSubjects().otpVerification,
    html: otpVerificationTemplate(firstName, otp),
    sender: emailFromAddress().otpSending,
  });
};

// ─── 2. Verify OTP + create user ──────────────────────────────────────────────

export const extensionVerifyOTPService = async (data: ExtensionVerifyOTPInput) => {
  const { email, otp, firstName, lastName, password, mobileNumber } = data;

  // Guard against race condition
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existingUser?.isEmailVerified) {
    throw new ApiError(409, "Email already registered. Please log in.");
  }

  const isValid = await OTPService.verifyOTP(email, otp);
  if (!isValid) throw new ApiError(400, "Invalid or expired OTP");

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashed,
      mobileNumber: mobileNumber ?? null,
      role: "CLIENT",
      isEmailVerified: true,
      isExtensionUser: true,
      accountType: "EXTENSION_ONLY",
    },
  });

  // Create ClientProfile immediately — needed if user later books on platform
  const clientProfile = await prisma.clientProfile.create({
    data: { userId: user.id },
  });

  // Seed ExtensionUsage for message tracking / billing
  await prisma.extensionUsage.create({
    data: { userId: user.id },
  });

  await emailQueue.add("clientWelcome", {
    to: email,
    subject: emailSubjects().welcome,
    html: welcomeEmailTemplate(user.firstName),
    sender: emailFromAddress().otpVerification,
  });

  const token = buildExtensionToken({
    id: user.id,
    email: user.email,
    mobileNumber: user.mobileNumber,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    profilePhoto: user.profilePhoto,
    clientProfileId: clientProfile.id,
    therapistProfileId: null,
  });

  return {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      accountType: "EXTENSION_ONLY",
      isExtensionUser: true,
      isClientProfileFilled: false,
      isTherapistProfileFilled: false,
    },
  };
};

// ─── 3. Login ──────────────────────────────────────────────────────────────────

export const extensionLoginService = async (data: ExtensionLoginInput) => {
  const { email, password } = data;

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: {
      id: true,
      email: true,
      isEmailVerified: true,
      firstName: true,
      lastName: true,
      password: true,
      mobileNumber: true,
      role: true,
      profilePhoto: true,
      isExtensionUser: true,
      accountType: true,
    },
  });

  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "ADMIN") throw new ApiError(403, "Insufficient permission");
  if (!user.isEmailVerified) throw new ApiError(400, "Please verify your email before logging in");
  if (!user.password) {
    throw new ApiError(400, "This account uses Google Sign-In. Please use Google to log in.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid password");

  // Upgrade accountType: PLATFORM → FULL (existing platform user using extension for first time)
  const newAccountType = user.accountType === "PLATFORM" ? "FULL" : user.accountType;
  const isFirstExtensionLogin = !user.isExtensionUser;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLogin: new Date(),
      isExtensionUser: true,
      accountType: newAccountType,
    },
  });

  if (isFirstExtensionLogin) {
    await prisma.extensionUsage.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });
  }

  let clientProfileId: string | null = null;
  let therapistProfileId: string | null = null;
  let isClientProfileFilled = false;
  let isTherapistProfileFilled = false;

  if (user.role === "CLIENT") {
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: user.id },
    });
    isClientProfileFilled = isClientProfileComplete(clientProfile);
    clientProfileId = clientProfile?.id ?? null;
  }

  if (user.role === "THERAPIST") {
    const therapistProfile = await prisma.therapistProfile.findUnique({
      where: { userId: user.id },
    });
    isTherapistProfileFilled = !!therapistProfile;
    therapistProfileId = therapistProfile?.id ?? null;
  }

  const token = buildExtensionToken({
    id: user.id,
    email: user.email,
    mobileNumber: user.mobileNumber,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    profilePhoto: user.profilePhoto,
    clientProfileId,
    therapistProfileId,
  });

  return {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      accountType: newAccountType,
      isExtensionUser: true,
      isClientProfileFilled,
      isTherapistProfileFilled,
    },
  };
};

// ─── 4. Google Sign-In ─────────────────────────────────────────────────────────

export const extensionGoogleSignInService = async (idToken: string) => {
  const ticket = await googleAuthClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) throw new ApiError(400, "Invalid Google token");

  const email = payload.email.toLowerCase();

  let clientProfileId: string | null = null;
  let therapistProfileId: string | null = null;
  let isClientProfileFilled = false;
  let isTherapistProfileFilled = false;

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    if (existingUser.role === "ADMIN") {
      throw new ApiError(403, "Admin login via Google is not allowed");
    }

    const newAccountType = existingUser.accountType === "PLATFORM" ? "FULL" : existingUser.accountType;

    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        googleAuthId: existingUser.googleAuthId ?? payload.sub,
        googleEmail: existingUser.googleEmail ?? payload.email,
        authProvider: existingUser.password ? "HYBRID" : "GOOGLE",
        profilePhoto: existingUser.profilePhoto ?? payload.picture ?? null,
        isExtensionUser: true,
        lastLogin: new Date(),
        accountType: newAccountType,
      },
    });

    await prisma.extensionUsage.upsert({
      where: { userId: existingUser.id },
      create: { userId: existingUser.id },
      update: {},
    });

    if (existingUser.role === "CLIENT") {
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { userId: existingUser.id },
      });
      isClientProfileFilled = isClientProfileComplete(clientProfile);
      clientProfileId = clientProfile?.id ?? null;
    }

    if (existingUser.role === "THERAPIST") {
      const therapistProfile = await prisma.therapistProfile.findUnique({
        where: { userId: existingUser.id },
      });
      isTherapistProfileFilled = !!therapistProfile;
      therapistProfileId = therapistProfile?.id ?? null;
    }

    const token = buildExtensionToken({
      id: existingUser.id,
      email: existingUser.email,
      mobileNumber: existingUser.mobileNumber,
      role: existingUser.role,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      profilePhoto: existingUser.profilePhoto ?? payload.picture ?? null,
      clientProfileId,
      therapistProfileId,
    });

    return {
      token,
      user: {
        id: existingUser.id,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        email: existingUser.email,
        role: existingUser.role,
        accountType: newAccountType,
        isExtensionUser: true,
        isClientProfileFilled,
        isTherapistProfileFilled,
      },
    };
  }

  // ── Brand new user via Google on extension ──────────────────────────────────
  const newUser = await prisma.user.create({
    data: {
      email,
      firstName: payload.given_name ?? "User",
      lastName: payload.family_name ?? "",
      googleAuthId: payload.sub,
      googleEmail: payload.email,
      profilePhoto: payload.picture ?? null,
      authProvider: "GOOGLE",
      isEmailVerified: true,
      role: "CLIENT",
      isExtensionUser: true,
      accountType: "EXTENSION_ONLY",
    },
  });

  const clientProfile = await prisma.clientProfile.create({
    data: { userId: newUser.id },
  });

  await prisma.extensionUsage.create({
    data: { userId: newUser.id },
  });

  await emailQueue.add("clientWelcome", {
    to: email,
    subject: emailSubjects().welcome,
    html: welcomeEmailTemplate(newUser.firstName),
    sender: emailFromAddress().otpVerification,
  });

  const token = buildExtensionToken({
    id: newUser.id,
    email: newUser.email,
    mobileNumber: newUser.mobileNumber,
    role: newUser.role,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    profilePhoto: newUser.profilePhoto,
    clientProfileId: clientProfile.id,
    therapistProfileId: null,
  });

  return {
    token,
    user: {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
      accountType: "EXTENSION_ONLY",
      isExtensionUser: true,
      isClientProfileFilled: false,
      isTherapistProfileFilled: false,
    },
  };
};