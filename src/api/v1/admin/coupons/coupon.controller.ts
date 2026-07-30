import { Request, Response } from "express";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import ApiError from "../../../../shared/utils/ApiError";
import { adminCouponService } from "./coupon.service";
import { CouponStatus } from "@prisma/client";

export const adminCouponController = {
  createCoupon: async (req: Request, res: Response) => {
    try {
      const adminId = req.user.id;
      const coupon = await adminCouponService.createCoupon(req.body, adminId);
      res.status(201).json(new ApiResponse(true, 201, "Coupon created successfully", coupon));
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(500).json(new ApiResponse(false, 500, "Internal server error"));
      }
    }
  },

  listCoupons: async (req: Request, res: Response) => {
    try {
      const { status, search, page, limit } = req.query;
      const result = await adminCouponService.listCoupons({
        status: status ? (status as CouponStatus) : undefined,
        search: search ? (search as string) : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      res.status(200).json(new ApiResponse(true, 200, "Coupons fetched successfully", result));
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(500).json(new ApiResponse(false, 500, "Internal server error"));
      }
    }
  },

  getCouponById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const coupon = await adminCouponService.getCouponById(id);
      res.status(200).json(new ApiResponse(true, 200, "Coupon details fetched", coupon));
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(500).json(new ApiResponse(false, 500, "Internal server error"));
      }
    }
  },

  updateCoupon: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updated = await adminCouponService.updateCoupon(id, req.body);
      res.status(200).json(new ApiResponse(true, 200, "Coupon updated successfully", updated));
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(500).json(new ApiResponse(false, 500, "Internal server error"));
      }
    }
  },

  toggleCouponStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await adminCouponService.toggleCouponStatus(id, status);
      res
        .status(200)
        .json(new ApiResponse(true, 200, `Coupon status changed to ${updated.status}`, updated));
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(500).json(new ApiResponse(false, 500, "Internal server error"));
      }
    }
  },

  getCouponUsages: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await adminCouponService.getCouponUsages(id, page, limit);
      res.status(200).json(new ApiResponse(true, 200, "Coupon usages fetched", result));
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(500).json(new ApiResponse(false, 500, "Internal server error"));
      }
    }
  },
};
