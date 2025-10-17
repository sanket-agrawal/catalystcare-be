import express from "express";
import { availabilityController } from "./availability.controller";

const router = express.Router();

router.post('/:therapistId/availability',availabilityController.createAvailability)

export default router;