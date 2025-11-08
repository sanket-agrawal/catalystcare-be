import express from "express"
import { paymentController } from "./payments.controller";
import { authenticate } from "../../../shared/middlewares/authenticatation";

const router = express.Router();

router.post('/create-order', authenticate,paymentController.createOrder);
router.post('/verify',authenticate,paymentController.verifyPayment)
router.post('/webhook',authenticate,paymentController.handleWebhook)


export default router;