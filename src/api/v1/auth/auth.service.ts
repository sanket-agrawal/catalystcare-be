import { prisma } from "../../../infrastructure/prisma/client";
import { hashPassword } from "../../../shared/utils/hashPassword";
import ApiError from "../../../shared/utils/ApiError";
import { RegisterUserInput } from "./auth.dto";
import { OTPService } from "../../../shared/utils/otp.service";
import { sendEmail } from "../../../infrastructure/email/index";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { emailSubjects } from "../../../shared/config/email.config";
import { otpVerificationTemplate, welcomeEmailTemplate } from "../../../shared/email-templates/auth";

export const registerUserService = async (data: RegisterUserInput) => {
  try {
  const { firstName, lastName, email, password, mobileNumber,role } = data;

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
      mobileNumber,
      role: role || "CLIENT",
    },
  });

    const otp =  await OTPService.generateOTP(user.email);
    await sendEmail(email, emailSubjects().otpVerification, otpVerificationTemplate(firstName,otp));

  } catch (error) {
    if(error instanceof ApiError) throw new ApiError(error.statusCode,error.message);
    throw new ApiError(500,"Failed to register user");
  }
};

export const verifyOTPService = async (email: string, otp: string) => {
  try {
    // Step 1: Verify OTP
    const isValid = await OTPService.verifyOTP(email, otp);
    if (!isValid) {
      throw new ApiError(400, "Invalid or expired OTP");
    }

    // Step 2: Fetch user
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select : {
        id : true,
        firstName : true,
        lastName : true,
        email : true,
        mobileNumber : true,
        role : true,
        isEmailVerified : true
      }
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Step 3: Mark email as verified (if not already)
    if (!user.isEmailVerified) {
      await prisma.user.update({
        where: { email },
        data: { isEmailVerified: true },
      });
    }

    // Step 4: Check profile completion
    let isClientProfileFilled = false;
    let isTherapistProfileFilled = false;

    if (user.role === "CLIENT") {
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { userId: user.id },
      });
      isClientProfileFilled = !!clientProfile;

      // Step 5: Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        phone: user.mobileNumber,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    await sendEmail(email, emailSubjects().welcome, welcomeEmailTemplate(user.firstName))

    // Step 6: Return same structure as loginService
    return {
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isClientProfileFilled,
        isTherapistProfileFilled,
      },
    };
    }

    if (user.role === "THERAPIST") {
      const therapistProfile = await prisma.therapistProfile.findUnique({
        where: { userId: user.id },
      });
      isTherapistProfileFilled = !!therapistProfile;

      // Step 5: Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        phone: user.mobileNumber,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    // Step 6: Return same structure as loginService
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
        isTherapistProfileFilled,
      },
    };
    }

    
  } catch (error) {
    console.error("Verify OTP Error:", error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "Invalid or expired OTP");
  }
};

export const loginService = async (email: string, password: string) => {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select : {
      id : true,
      email : true,
      isEmailVerified : true,
      firstName : true,
      lastName : true,
      password : true,
      mobileNumber : true,
      role : true,
      profilePhoto : true
    }
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
    { id: user.id, email: user.email, phone : user.mobileNumber ,role: user.role, firstName : user.firstName, lastName : user.lastName, profilePhoto : user.profilePhoto },
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

export const forgotPasswordService = async (email: string) => {
  try {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const otp = await OTPService.generateOTP(user.email);
  await sendEmail(email, "Reset your password", `Your OTP is ${otp}`);
} catch (error) {
  throw new ApiError(400,"Failed to send OTP");  
}
};