import dotenv from 'dotenv';

dotenv.config();

export const emailSubjects = () => ({
    otpVerification: "Your OTP Code - Verify Your Email - CatalystCare",
    welcome : "Welcome to Catalystcare! See how your life is going to change.",
    forgotPassword : "Reset Your Password - CatalystCare",
});