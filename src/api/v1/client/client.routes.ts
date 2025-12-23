import express from "express"
import { clientController } from "./client.controller";
import {authenticate} from '../../../shared/middlewares/authenticatation'
import { createAssessmentSchema } from "./client.dto";
import { validateRequest } from "../../../shared/middlewares/validate";

const router = express.Router()

router.post('/profile-update',authenticate,clientController.profileUpdate);
router.post('/assessment-submit',authenticate,validateRequest(createAssessmentSchema),clientController.assessmentSubmit);
router.get('/get-assessments',authenticate,clientController.getAssessments);
router.get('/fetch-assessment-based-therapist/:assessmentId',authenticate,clientController.getTherapistsByUserNeeds);
router.get('/bookings',authenticate,clientController.fetchBookings);
router.post('/reschedule-therapy-session',authenticate,clientController.rescheduleTherapySession);
router.post('/cancel-therapy-session',authenticate,clientController.cancelTherapySession);

export default router;

