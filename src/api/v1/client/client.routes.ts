import express from "express";
import { clientController } from "./client.controller";
import { authenticate } from "../../../shared/middlewares/authenticatation";
import { createAssessmentSchema, submitSessionIntakeSchema } from "./client.dto";
import { validateRequest } from "../../../shared/middlewares/validate";
import testimonalRoutes from "./testimonial/testimonail.routes";
import { authorizeRoles } from "../../../shared/middlewares/rbac";
import programRoutes from "./programBooking/programBooking.routes";
import sessionRoutes from "./sessions/session.routes";

const router = express.Router();

router.post("/profile-update", authenticate, clientController.profileUpdate);
router.post(
  "/assessment-submit",
  authenticate,
  validateRequest(createAssessmentSchema),
  clientController.assessmentSubmit
);
router.patch(
  "/assessment",
  authenticate,
  validateRequest(createAssessmentSchema),
  clientController.updateAssessment
);
router.get("/get-assessments", authenticate, clientController.getAssessments);
router.get(
  "/fetch-assessment-based-therapist",
  authenticate,
  clientController.getTherapistsByUserNeeds
);
router.get(
  "/fetch-assessment-based-therapist/:assessmentId",
  authenticate,
  clientController.getTherapistsByUserNeeds
);
router.get("/bookings", authenticate, authorizeRoles("CLIENT"), clientController.fetchBookings);
router.patch(
  "/bookings/:bookingId/notes",
  authenticate,
  authorizeRoles("CLIENT"),
  clientController.updateBookingNotes
);
router.post(
  "/bookings/:bookingId/intake",
  authenticate,
  authorizeRoles("CLIENT"),
  validateRequest(submitSessionIntakeSchema),
  clientController.submitSessionIntake
);
router.get(
  "/upcoming-bookings",
  authenticate,
  authorizeRoles("CLIENT"),
  clientController.getUpcomingBookings
);
router.use("/testimonials", authenticate, authorizeRoles("CLIENT"), testimonalRoutes);
router.use("/programs", authenticate, authorizeRoles("CLIENT"), programRoutes);
router.use("/sessions", authenticate, authorizeRoles("CLIENT"), sessionRoutes);

router.get(
  "/dashboard/pending-list",
  authenticate,
  authorizeRoles("CLIENT"),
  clientController.pendingList
);

export default router;
