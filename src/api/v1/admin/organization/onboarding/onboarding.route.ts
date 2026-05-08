import express from "express"
import OnboardingController from "./onboarding.controller";
import { validate } from "../../../../../infrastructure/zod/validator";
import { createOrganizationSchema, updateOrganizationSchema } from "./onboarding.validations";

const router = express.Router();

router.get('/requests',OnboardingController.fetchOnboardingRequests);
router.post('/create-organization',validate(createOrganizationSchema),OnboardingController.createOrganization)
router.patch('/update-organization/:id',validate(updateOrganizationSchema),OnboardingController.updateOrganization)

export default router;