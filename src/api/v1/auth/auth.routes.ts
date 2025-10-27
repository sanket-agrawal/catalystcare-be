import express from "express";
import { forgotPassword, login, registerUser, resetPassword, verifyForgotPasswordOTP, verifyOTP } from "./auth.controller";
import { validateRequest } from "../../../shared/middlewares/validate";
import { registerUserSchema, verifyOTPSchema } from "./auth.dto";

const router = express.Router();

router.post("/register", validateRequest(registerUserSchema), registerUser);
router.post("/verify-otp", validateRequest(verifyOTPSchema), verifyOTP);
router.post("/login", login);
router.post('/forgot-password',forgotPassword);
router.post('/reset-password',resetPassword);
router.post('/verify-forgot-password-otp',verifyForgotPasswordOTP)

export default router;
