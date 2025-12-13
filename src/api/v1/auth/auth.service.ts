import { prisma } from "../../../infrastructure/prisma/client";
import { hashPassword } from "../../../shared/utils/hashPassword";
import ApiError from "../../../shared/utils/ApiError";
import { RegisterUserInput, verifyOTPInput } from "./auth.dto";
import { OTPService } from "../../../shared/utils/otp.service";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { emailFromAddress, emailSubjects } from "../../../shared/config/email.config";
import { forgotPasswordOtpTemplate, otpVerificationTemplate, welcomeEmailTemplate } from "../../../shared/email-templates/auth";
import { emailQueue } from "../../../infrastructure/queues/index";

export const registerUserService = async (data: RegisterUserInput) => {
  try {
  const { email, mobileNumber, firstName } = data;

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

    const otp =  await OTPService.generateOTP(email);
    await emailQueue.add('sendOtp',{
      to : email,
      subject : emailSubjects().otpVerification,
      html : otpVerificationTemplate(firstName,otp),
      sender : emailFromAddress().otpSending
    });

  } catch (error) {
    if(error instanceof ApiError) throw new ApiError(error.statusCode,error.message);
    throw new ApiError(500,"Failed to register user");
  }
};

export const verifyOTPService = async (data : verifyOTPInput) => {
  try {
    // Step 1: Verify OTP
    const {email, otp, firstName , lastName , password ,mobileNumber , role } = data;
    const isValid = await OTPService.verifyOTP(email, otp);
    if (!isValid) {
      throw new ApiError(400, "Invalid or expired OTP");
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
      isEmailVerified: true
    },
  });

    // Step 4: Check profile completion
    let isClientProfileFilled = false;
    let isTherapistProfileFilled = false;

    if (user.role === "CLIENT") {
      let clientProfile = null;
      clientProfile = await prisma.clientProfile.findUnique({
        where: { userId: user.id },
      });

      if(clientProfile){
        isClientProfileFilled = true;
      }else{
          clientProfile = await prisma.clientProfile.create({
              data: {
                userId: user.id,
              },
            });
        isClientProfileFilled = false;
      }
      // isClientProfileFilled = !!clientProfile;

      // Step 5: Generate JWT
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
        firstName : user.firstName,
        lastName : user.lastName,
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
    if (error instanceof ApiError) throw new ApiError(error.statusCode, error.message);
    throw error;
  }
};

export const loginService = async (email: string, password: string) => {
  if(email == 'admin@catalystcare.in'){
    throw new ApiError(400,'Insufficient Permission')
  }

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

  if(user.role == 'ADMIN'){
    throw new ApiError(400, "Insufficient Permission")
  }

  if(!user.isEmailVerified){
    throw new ApiError(400, "Please verify your email before logging in");
  }

  if (!user.password) {
    throw new ApiError(400, "This account does not support password login. Use Google Sign-In");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

    await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  let isClientProfileFilled = false;
let isTherapistProfileFilled = false;
let therapistProfileId =  null;
let clientProfileId = null;

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
  await emailQueue.add('forgotPasswordSendOtp',{
    to : email,
    subject : emailSubjects().forgotPassword,
    html : forgotPasswordOtpTemplate(user.firstName,otp),
    sender : emailFromAddress().otpSending
  });

} catch (error) {
  if(error instanceof ApiError) new ApiError(error.statusCode,error.message);  
  throw error;
}
};

export const verifyForgotPasswordOTPService = async (email : string, otp : string) => {
  try {
    const isValid = await OTPService.verifyOTP(email, otp);
    if (!isValid) {
      throw new ApiError(400, "Invalid or expired OTP");
    }

    return true;

  } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(400, "Invalid or expired OTP");
  }
}

export const resetPasswordService = async (password : string,confirmPassword : string, email : string) => {
  try {

    if(password !== confirmPassword){
      throw new ApiError(400,"Password Mismatch")
    }

    if (!email) {
    throw new ApiError(400, "Email is required for password reset");
  }

    const user = await prisma.user.findUnique({
      where : {email}
    });

    if(!user){
      throw new ApiError(409,"User Not Found");
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
    });
    
  } catch (error) {
    if(error instanceof ApiError) throw new ApiError(error.statusCode,error.message)
    throw new ApiError(400,"Error Reseting Password")
  }
}