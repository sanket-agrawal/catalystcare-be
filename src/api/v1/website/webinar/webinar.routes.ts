import express from "express"
import { fetchWebinarById, initiateWebinarRegistration, verifyWebinarPaymentController } from "./webinar.controller";

const router = express.Router();

router.get('/:id',fetchWebinarById);
router.post('/register/create-order',initiateWebinarRegistration);
router.post(
  '/verify-payment',
  verifyWebinarPaymentController
);
export default router;