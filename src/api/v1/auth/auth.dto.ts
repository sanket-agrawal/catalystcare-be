import { z } from "zod";

export enum UserRole {
  CLIENT = "CLIENT",
  THERAPIST = "THERAPIST",
  ADMIN = "ADMIN"
}
 
export const registerUserSchema = z.object({
  firstName: z
    .string()
    .max(50, "First name is too long"),
  email: z.string().email("Invalid email address"),
  mobileNumber : z.string().min(10, "Mobile number must be at least 10 digits long").max(10, "Mobile number is too long"),
    role: z
    .enum([UserRole.CLIENT, UserRole.THERAPIST, UserRole.ADMIN])
    .optional(),
});

export const verifyOTPSchema = z.object({
    firstName: z
    .string()
    .max(50, "First name is too long"),
  lastName: z
    .string()
    .max(50, "Last name is too long"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(9, "Password is too long")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[@$!%*?&#]/, "Must contain at least one special character"),
  mobileNumber : z.string().min(10, "Mobile number must be at least 10 digits long").max(10, "Mobile number is too long"),
    role: z
    .enum([UserRole.CLIENT, UserRole.THERAPIST, UserRole.ADMIN])
    .optional(),
  otp: z.string().length(6, "OTP must be 6 digits long"),
});

export type RegisterUserInput = {
  firstName : string;
  email: string;
  password: string;
  mobileNumber : string;
  role? : UserRole
}

export type verifyOTPInput = {
  otp : string,
  firstName : string;
  lastName : string;
  email: string;
  password: string;
  mobileNumber : string;
  role? : UserRole
}
