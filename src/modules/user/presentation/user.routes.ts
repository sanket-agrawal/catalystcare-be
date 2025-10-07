import { Router } from "express";
import { registerUser, verifyOTP } from "./user.controller";

const router = Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOTP);

export default router;
