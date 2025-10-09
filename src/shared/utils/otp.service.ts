import { prisma } from "../../infrastructure/prisma/client";
import crypto from "crypto";

export const OTPService =  {
  async generateOTP(email: string): Promise<string> {
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.oTPVerification.create({
      data: { email, otp, expiresAt },
    });

    return otp;
  },

  async verifyOTP(email: string, otp: string) {
    const record = await prisma.oTPVerification.findFirst({
      where: { email, otp, verified: false, expiresAt: { gt: new Date() } },
    });

    if (!record) throw new Error("Invalid or expired OTP");

    await prisma.oTPVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    return true;
  }
}
