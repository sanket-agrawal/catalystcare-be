import express from "express"
import {
  createOrgPlanSchema,
  updateOrgPlanSchema,
} from "./custom-plan.validations";
import { validate } from "../../../../../infrastructure/zod/validator";
import CustomPlanController from "./custom-plan.controller";

const router = express.Router();

router.post("/create",validate(createOrgPlanSchema),CustomPlanController.create);
router.patch("/update/:id",validate(updateOrgPlanSchema),CustomPlanController.update)

export default router;