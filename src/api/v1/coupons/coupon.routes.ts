import express from "express";
import { clientCouponController } from "./coupon.controller";
import { authenticate } from "../../../shared/middlewares/authenticatation";
import { validateRequest } from "../../../shared/middlewares/validate";
import { applyCouponSchema } from "./coupon.dto";
import { authorizeRoles } from "../../../shared/middlewares/rbac";

const router = express.Router();

router.get("/", clientCouponController.getWebsiteCoupons);
router.get("/public", clientCouponController.getWebsiteCoupons);

router.post(
  "/apply",
  authenticate,
  authorizeRoles("CLIENT"),
  validateRequest(applyCouponSchema),
  clientCouponController.applyCoupon
);

export default router;
