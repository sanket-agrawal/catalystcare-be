import express from "express"
import { clientController } from "./client.controller";
import {authenticate} from '../../../shared/middlewares/authenticatation'
import { createAssessmentSchema } from "./client.dto";
import { validateRequest } from "../../../shared/middlewares/validate";
import testimonalRoutes from "./testimonial/testimonail.routes";
import { authorizeRoles } from "../../../shared/middlewares/rbac";
import programRoutes from "./programBooking/programBooking.routes"

const router = express.Router()

router.post('/profile-update',authenticate,clientController.profileUpdate);
router.post('/assessment-submit',authenticate,validateRequest(createAssessmentSchema),clientController.assessmentSubmit);
router.get('/get-assessments',authenticate,clientController.getAssessments);
router.get('/fetch-assessment-based-therapist/:assessmentId',authenticate,clientController.getTherapistsByUserNeeds);
router.get('/bookings',authenticate,clientController.fetchBookings);
router.post('/reschedule-therapy-session',authenticate,clientController.rescheduleTherapySession);
router.post('/cancel-therapy-session',authenticate,clientController.cancelTherapySession);
router.use('/testimonials',authenticate,authorizeRoles('CLIENT'),testimonalRoutes);
router.use('/programs',authenticate,authorizeRoles('CLIENT'),programRoutes);

router.get("/dashboard/pending-list",authenticate,authorizeRoles('CLIENT'),clientController.pendingList);

export default router;

