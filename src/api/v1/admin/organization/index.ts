import express from "express"
import onboardingRouter from "./onboarding/onboarding.route"

const router = express.Router();

router.use('/onboarding',onboardingRouter);

export default router;