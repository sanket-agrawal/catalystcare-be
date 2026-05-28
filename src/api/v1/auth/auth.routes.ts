import express from "express";
import {
  forgotPassword,
  login,
  logout,
  refreshToken,
  registerUser,
  resetPassword,
  verifyForgotPasswordOTP,
  verifyOTP,
  googleSignin,
} from "./auth.controller";
import { validateRequest } from "../../../shared/middlewares/validate";
import { registerUserSchema, verifyOTPSchema, loginSchema } from "./auth.dto";
import googleRoutes from "./google/googleAuth.routes";

const router = express.Router();

router.post("/register", validateRequest(registerUserSchema), registerUser);
router.post("/verify-otp", validateRequest(verifyOTPSchema), verifyOTP);
router.post("/login", validateRequest(loginSchema), login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-forgot-password-otp", verifyForgotPasswordOTP);
router.post("/google-signin", googleSignin);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

router.use("/google", googleRoutes);

export default router;
