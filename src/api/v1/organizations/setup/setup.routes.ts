import express from "express"
import SetupController from "./setup.controller";
import { validate } from "../../../../infrastructure/zod/validator";
import { acceptAdminInviteSchema, OrgSetupSchema } from "./setup.validations";

const router = express.Router();

router.route("/:token")
  .get(SetupController.validateSetupToken)
  .post(validate(OrgSetupSchema), SetupController.submitAdminEmail);

router.get("/invite/:token", SetupController.validateAdminInviteToken)

router.post("/invite/accept", validate(acceptAdminInviteSchema), SetupController.acceptAdminInvite)

export default router;