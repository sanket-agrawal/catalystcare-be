import express from "express";
import userRoutes from "./user/user.routes";
import authRoutes from "./auth/auth.routes";
import websiteRoutes from "./website/website.routes";
import therapistRoutes from "./therapist/therapist.routes";
import masterRoutes from "./master-data/index";
import uploadRoutes from "./upload/upload.routes";
import adminRoutes from "./admin/admin.routes";
import clientRoutes from "./client/client.routes";
import healthRoutes from "./health/health.routes";
import paymentRoutes from "./payments/payments.routes";
import emailRoutes from "./email/email.routes";
import organizationRoutes from "./organizations/index";
import aiRoutes from "./ai/ai.routes";

import { authorizeRoles } from "../../shared/middlewares/rbac";
import { authenticate } from "../../shared/middlewares/authenticatation";
import {
  globalLimiter,
  authLimiter,
  aiLimiter,
  uploadLimiter,
} from "../../shared/middlewares/rateLimiter";
// import chatRoutes from "./chat/chat.routes";

const router = express.Router();

// Health routes bypass all rate limiting
router.use("/health", healthRoutes);

// Apply global rate limiter to all other v1 API routes
router.use(globalLimiter);

router.use("/user", userRoutes);
router.use("/auth", authLimiter, authRoutes);
router.use("/website", websiteRoutes);
router.use("/therapist", therapistRoutes);
router.use("/master-data", authenticate, authorizeRoles("ADMIN"), masterRoutes);
router.use("/organizations", organizationRoutes);
router.use("/upload", uploadLimiter, uploadRoutes);
router.use("/admin", adminRoutes);
router.use("/client", clientRoutes);
router.use("/payments", paymentRoutes);
router.use("/email", emailRoutes);
router.use("/ai", aiLimiter, aiRoutes);
// router.use('/chat',chatRoutes);

export default router;
