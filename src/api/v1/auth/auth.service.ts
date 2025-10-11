import { prisma } from "../../../infrastructure/prisma/client";
import { hashPassword } from "../../../shared/utils/hashPassword";
import ApiError from "../../../shared/utils/ApiError";
import { RegisterUserInput } from "./auth.dto";
import { OTPService } from "../../../shared/utils/otp.service";
import { sendEmail } from "../../../infrastructure/email/email.service";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUserService = async (data: RegisterUserInput) => {
  try {
  const { firstName, lastName, email, password, mobileNumber } = data;

const existingUser = await prisma.user.findFirst({
  where: {
    OR: [
      { email: email.toLowerCase() },
      { mobileNumber },
    ],
  },
});

if (existingUser) {
  if (existingUser.email === email.toLowerCase()) {
    throw new ApiError(409, "Email already registered");
  }

  if (existingUser.mobileNumber === mobileNumber) {
    throw new ApiError(409, "Mobile number already registered");
  }
}

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashed,
      mobileNumber
    },
  });

    const otp =  await OTPService.generateOTP(user.email);
    await sendEmail(email, "Verify your account", `Your OTP is ${otp}`);

  } catch (error) {
    throw new Error("Registration failed");
  }
};

export const verifyOTPService = async (email: string, otp: string) => {
  try {
  const isValid = await OTPService.verifyOTP(email, otp); 
  if (!isValid) {
    throw new ApiError(400, "Invalid or expired OTP");
  } 
  return { message: "Account verified successfully" };
  } catch (error) {
    throw new ApiError(400,"Invalid or expired OTP");
  }
}

export const loginService = async (email: string, password: string) => {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if(!user.isEmailVerified){
    throw new ApiError(400, "Please verify your email before logging in");
  }

  if (!user.password) {
    throw new ApiError(400, "Invalid login method for this account");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  let isClientProfileFilled = false;
let isTherapistProfileFilled = false;

if (user.role === "CLIENT") {
  const clientProfile = await prisma.clientProfile.findUnique({ where: { userId: user.id } });
  isClientProfileFilled = !!clientProfile;
}

if (user.role === "THERAPIST") {
  const therapistProfile = await prisma.therapistProfile.findUnique({ where: { userId: user.id } });
  isTherapistProfileFilled = !!therapistProfile;
}


  const token = jwt.sign(
    { id: user.id, email: user.email, phone : user.mobileNumber ,role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return {
    message: "Login successful",
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isClientProfileFilled,
      isTherapistProfileFilled
    },
  };
};