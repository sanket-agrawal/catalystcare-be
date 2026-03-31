import { Request, Response } from "express";
import ApiError from "../../../../../shared/utils/ApiError";
import ApiResponse from "../../../../../shared/utils/ApiResponse";
import CustomPlanService from "./custom-plan.service";


const CustomPlanController = {
  create: async (req: Request, res: Response) => {
    try {

      const adminId = req.user?.id; // assuming auth middleware

      const plan = await CustomPlanService.create(adminId, req.body);

      return res
        .status(201)
        .json(new ApiResponse(true, 201, "Plan created", plan));
    } catch (error) {
      if (error instanceof ApiError) {
        return res
          .status(error.statusCode)
          .json(new ApiResponse(false, error.statusCode, error.message));
      }

      return res
        .status(500)
        .json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },

  getAll: async (_req: Request, res: Response) => {
    try {
      const plans = await CustomPlanService.getAll();

      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Plans fetched", plans));
    } catch {
      return res
        .status(500)
        .json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const plan = await CustomPlanService.getById(id);

      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Plan fetched", plan));
    } catch (error) {
      if (error instanceof ApiError) {
        return res
          .status(error.statusCode)
          .json(new ApiResponse(false, error.statusCode, error.message));
      }

      return res
        .status(500)
        .json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const plan = await CustomPlanService.update(id, req.body);

      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Plan updated", plan));
    } catch (error) {
      if (error instanceof ApiError) {
        return res
          .status(error.statusCode)
          .json(new ApiResponse(false, error.statusCode, error.message));
      }

      return res
        .status(500)
        .json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await CustomPlanService.delete(id);

      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Plan deleted"));
    } catch (error) {
      if (error instanceof ApiError) {
        return res
          .status(error.statusCode)
          .json(new ApiResponse(false, error.statusCode, error.message));
      }

      return res
        .status(500)
        .json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },
};

export default CustomPlanController;