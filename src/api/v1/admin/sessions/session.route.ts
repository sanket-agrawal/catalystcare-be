import express from 'express'
import AdminSessionController from './session.controller';

const router = express.Router();

router.get('/reschedule-requests', AdminSessionController.fetchRescheduleRequests);

export default router;