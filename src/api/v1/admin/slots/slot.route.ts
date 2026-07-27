import express from "express";
import AdminSlotController from "./slot.controller";

const router = express.Router();

router.post("/generate", AdminSlotController.generateSlotsForTherapist);

export default router;
