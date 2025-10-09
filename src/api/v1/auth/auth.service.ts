import { prisma } from "../../../infrastructure/prisma/client";
import { hashPassword } from "../../../shared/utils/hashPassword";
import ApiError from "../../../shared/utils/ApiError";
import { RegisterUserInput } from "./auth.dto";
import { OTPService } from "../../../shared/utils/otp.service";
import { sendEmail } from "../../../infrastructure/email/email.service";

export const registerUserService = async (data: RegisterUserInput) => {
  const { firstName, lastName, email, password } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashed,
    },
  });

    const otp =  await OTPService.generateOTP(user.email);
    await sendEmail(email, "Verify your account", `Your OTP is ${otp}`);

  const { password: _, ...safeUser } = user;
  return safeUser;
};
