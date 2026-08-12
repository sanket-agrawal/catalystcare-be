import express from "express";
import { adminCouponController } from "./coupon.controller";
import { validateRequest } from "../../../../shared/middlewares/validate";
import { createCouponSchema, updateCouponSchema } from "./coupon.dto";

const router = express.Router();

router.post("/", validateRequest(createCouponSchema), adminCouponController.createCoupon);
router.get("/", adminCouponController.listCoupons);
router.get("/:id", adminCouponController.getCouponById);
router.patch("/:id", validateRequest(updateCouponSchema), adminCouponController.updateCoupon);
router.patch("/:id/toggle-status", adminCouponController.toggleCouponStatus);
router.get("/:id/usages", adminCouponController.getCouponUsages);

export default router;
