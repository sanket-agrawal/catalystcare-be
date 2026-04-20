import express from "express"
import SetupController from "./setup.controller";
import { validate } from "../../../../infrastructure/zod/validator";
import { acceptAdminInviteSchema, OrgSetupSchema } from "./setup.validations";

const router = express.Router();

router.route("/validate-token").get(SetupController.validateSetupToken)

router.route("/submit-admin-email")
  .post(validate(OrgSetupSchema), SetupController.submitOrgAdminEmail);

router.get("/invite/validate", SetupController.validateInviteToken)

router.post("/invite/accept", validate(acceptAdminInviteSchema), SetupController.acceptOrgInvite)

export default router;