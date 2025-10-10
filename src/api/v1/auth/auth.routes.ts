import express from "express";
import { registerUser, verifyOTP } from "./auth.controller";
import { validateRequest } from "../../../shared/middlewares/validate";
import { registerUserSchema, verifyOTPSchema } from "./auth.dto";

const router = express.Router();

router.post("/register", validateRequest(registerUserSchema), registerUser);
router.post("/verify-otp", validateRequest(verifyOTPSchema), verifyOTP);

export default router;
