import { Request, Response } from "express";
import { RegisterUserService } from "../application/register-user.service";
import { OTPService } from "../../../shared/utils/otp.service";
import { PrismaUserRepository } from "../infrastructure/prisma.user.repository";

const registerService = new RegisterUserService();
const otpService = new OTPService();
const userRepo = new PrismaUserRepository();

export const registerUser = async (req: Request, res: Response) => {
    try{
  const { firstName, lastName, email, password } = req.body;
  const result = await registerService.execute(firstName, lastName, email, password);
  res.json(result);
    }catch(err:any){
        res.status(400).json({error:err.message});
    }   
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  await otpService.verifyOTP(email, otp);
  await userRepo.verifyEmail(email);
  res.json({ message: "Email verified successfully" });
};
