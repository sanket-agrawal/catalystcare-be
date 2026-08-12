import { Request, Response } from "express";
import ApiResponse from "../../../shared/utils/ApiResponse";
import ApiError from "../../../shared/utils/ApiError";
import { clientCouponService } from "./coupon.service";

export const clientCouponController = {
  applyCoupon: async (req: Request, res: Response) => {
    try {
      const { id: userId, clientProfileId } = req.user;

      if (!clientProfileId) {
        throw new ApiError(403, "Only client accounts can apply coupons");
      }

      const result = await clientCouponService.validateAndCalculateDiscount(
        req.body,
        userId,
        clientProfileId
      );

      res.status(200).json(new ApiResponse(true, 200, "Coupon applied successfully", result));
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(500).json(new ApiResponse(false, 500, "Internal server error"));
      }
    }
  },

  getWebsiteCoupons: async (req: Request, res: Response) => {
    try {
      const applicableFor = req.query.applicableFor as "SINGLE" | "PROGRAM" | undefined;
      const coupons = await clientCouponService.getWebsiteCoupons(applicableFor);
      res
        .status(200)
        .json(new ApiResponse(true, 200, "Website coupons fetched successfully", coupons));
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(500).json(new ApiResponse(false, 500, "Internal server error"));
      }
    }
  },
};
