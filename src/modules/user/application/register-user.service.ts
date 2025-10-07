import { PrismaUserRepository } from "../infrastructure/prisma.user.repository";
import { OTPService } from "../../../shared/utils/otp.service";
import { sendEmail } from "../../../infrastructure/email/email.service";
import bcrypt from "bcryptjs";

export class RegisterUserService {
  private userRepo = new PrismaUserRepository();
  private otpService = new OTPService();

  async execute(firstName: string, lastName: string, email: string, password: string) {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new Error("User already exists");

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.userRepo.create({
      firstName,
      lastName,
      email,
      password: hashed,
      role: "CLIENT",
    });

    const otp = await this.otpService.generateOTP(email);
    await sendEmail(email, "Verify your account", `Your OTP is ${otp}`);

    return { message: "OTP sent to email", userId: user.id };
  }
}
