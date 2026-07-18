import express from "express";
import { paymentController } from "./payments.controller";
import { authenticate } from "../../../shared/middlewares/authenticatation";
import programPaymentRoutes from "./programs/programPayment.routes";
import { authorizeRoles } from "../../../shared/middlewares/rbac";

const router = express.Router();

router.post("/create-order", authenticate, paymentController.createOrder);
router.post("/verify", authenticate, paymentController.verifyPayment);
router.post("/webhook", authenticate, paymentController.handleWebhook);
router.post("/cancel-order", authenticate, paymentController.cancelOrder);
router.use("/programs", authenticate, authorizeRoles("CLIENT"), programPaymentRoutes);

export default router;
