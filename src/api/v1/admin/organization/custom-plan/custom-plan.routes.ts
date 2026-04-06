import express from "express"
import {
  createCustomPlanSchema,
  createPaymentLinkSchema,
  recordPaymentSchema,
  updateCustomPlanSchema,
} from "./custom-plan.validations";
import { validate } from "../../../../../infrastructure/zod/validator";
import CustomPlanController from "./custom-plan.controller";

const router = express.Router();

router.post(
  "/create",
  validate(createCustomPlanSchema),
  CustomPlanController.create
);

router.get("/:orgId", CustomPlanController.getByOrg);

router.patch(
  "/update/:orgId",
  validate(updateCustomPlanSchema),
  CustomPlanController.update
);

router.post("/:orgId/send-payment-link", validate(createPaymentLinkSchema),CustomPlanController.sendPaymentLink);

router.post("/:orgId/record-payment", validate(recordPaymentSchema),CustomPlanController.recordPayment);

export default router;