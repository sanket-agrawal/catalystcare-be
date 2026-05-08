import express from "express"
import onboardingRouter from "./onboarding/onboarding.route"
import customPlanRouter from "./custom-plan/custom-plan.routes"

const router = express.Router();

router.use('/onboarding',onboardingRouter);
router.use('/custom-plan',customPlanRouter);

export default router;