import express from "express"
import TherapistSessionController from "./session.controller";
import sessionNotesRoutes from "./notes/session-notes.routes";

const router = express.Router();

router.post('/reschedule-request',TherapistSessionController.rescheduleSession)

router.use('/notes', sessionNotesRoutes);

export default router;
