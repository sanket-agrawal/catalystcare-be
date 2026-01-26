import express from "express"
import TherapistSessionController from "./session.controller";

const router = express.Router();

router.post('/reschedule-request',TherapistSessionController.rescheduleSession)

export default router;
