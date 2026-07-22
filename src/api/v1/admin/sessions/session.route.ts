import express from "express";
import AdminSessionController from "./session.controller";
import { validateRequest } from "../../../../shared/middlewares/validate";
import { cancelBookingSchema } from "../admin.dto";

const router = express.Router();

router.get("/reschedule-requests", AdminSessionController.fetchRescheduleRequests);
router.post("/process-reschedule-request", AdminSessionController.processRescheduleRequest);
router.post(
  "/cancel-booking",
  validateRequest(cancelBookingSchema),
  AdminSessionController.cancelBooking
);

export default router;
