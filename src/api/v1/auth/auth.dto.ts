import { z } from "zod";

export const registerUserSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters long")
    .max(50, "First name is too long"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters long")
    .max(50, "Last name is too long"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(64, "Password is too long")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[@$!%*?&#]/, "Must contain at least one special character"),
  mobileNumber : z.string().min(10, "Mobile number must be at least 10 digits long").max(10, "Mobile number is too long"),
});

export const verifyOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits long"),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
