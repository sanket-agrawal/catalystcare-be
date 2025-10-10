import { prisma } from "../../../infrastructure/prisma/client";
import { hashPassword } from "../../../shared/utils/hashPassword";
import ApiError from "../../../shared/utils/ApiError";
import { RegisterUserInput } from "./auth.dto";
import { OTPService } from "../../../shared/utils/otp.service";
import { sendEmail } from "../../../infrastructure/email/email.service";

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

  const { password: _, ...safeUser } = user;
  return safeUser;
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
    throw new Error("Invalid or expired OTP");
  }
}