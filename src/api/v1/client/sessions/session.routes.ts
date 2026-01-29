import express from "express";
import ClientSessionController from "./session.controller";

const router = express.Router();

router.post('/reschedule',ClientSessionController.rescheduleSession);

export default router;