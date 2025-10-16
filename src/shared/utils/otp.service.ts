import { prisma } from "../../infrastructure/prisma/client";
import crypto from "crypto";
import bcrypt from 'bcryptjs';
import { hashOtp } from "./hashPassword";
import ApiError from "./ApiError";

export const OTPService =  {
  async generateOTP(email: string): Promise<string> {
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const hashedOtp = await hashOtp(otp);

    await prisma.oTPVerification.create({
      data: { email, otp: hashedOtp, expiresAt },
    });

    return otp;
  },

  async verifyOTP(email: string, otp: string) {
    try {
    const record = await prisma.oTPVerification.findFirst({
      where: { email, otp, verified: false, expiresAt: { gt: new Date() } },
    });

    if (!record) throw new Error("Invalid or expired OTP");

    const isOtpValid = await bcrypt.compare(otp,record.otp);
    if (!isOtpValid) {
    throw new ApiError(400, "Invalid OTP");
    }


    await prisma.oTPVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    await prisma.user.update({
      where: { email: email },
      data: { isEmailVerified: true },
    });

    return true;
    } catch (error) {
      throw new Error("Invalid or expired OTP");
    }

  }
}
