import express from "express";
import {
  fetchAllCategories,
  fetchCategoryDetailsBySlug,
  fetchTherapistBySlug,
  fetchTherapistProfiles,
  requestSlotNotification,
} from "./website.controller";
import { createContact } from "../../../infrastructure/mongodb/controllers/contact.controller";
import assessmentRoutes from "./assessments/assessment.routes";
import webinarRoutes from "./webinar/webinar.routes";
import { clientCouponController } from "../coupons/coupon.controller";
import { authenticate } from "../../../shared/middlewares/authenticatation";
import { authorizeRoles } from "../../../shared/middlewares/rbac";
const router = express.Router();

router.get("/categories", fetchAllCategories);
router.get("/therapists", fetchTherapistProfiles);
router.get("/category/:slug", fetchCategoryDetailsBySlug);
router.get("/therapist/:slug", fetchTherapistBySlug);
router.post(
  "/therapist/:therapistId/notify-me",
  authenticate,
  authorizeRoles("CLIENT"),
  requestSlotNotification
);
router.post(
  "/therapist/slug/:slug/notify-me",
  authenticate,
  authorizeRoles("CLIENT"),
  requestSlotNotification
);
router.get("/coupons", clientCouponController.getWebsiteCoupons);
router.post("/contact", createContact);
router.use("/assessments", assessmentRoutes);
router.use("/webinars", webinarRoutes);

export default router;
