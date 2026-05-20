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

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .transform((s) => s.trim()),
  password: z.string().max(100),
  source : z.enum(["PLATFORM", "EXTENSION"]).default("PLATFORM"),
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
    .max(15, "Password is too long, password should be 15 characters maximum")
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
  role? : UserRole;
  source?: "platform" | "extension"; 
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
