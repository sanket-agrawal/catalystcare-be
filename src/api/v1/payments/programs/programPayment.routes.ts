import express from "express";
import ProgramPurchaseController from "./programPayments.controller";

const router = express.Router();

router.post('/create-order',ProgramPurchaseController.createProgramBookingOrder)

export default router;