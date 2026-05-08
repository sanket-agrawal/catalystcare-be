import { Request, Response } from "express";
import ApiError from "../../../../../shared/utils/ApiError";
import ApiResponse from "../../../../../shared/utils/ApiResponse";
import CustomPlanService from "./custom-plan.service";


const CustomPlanController = {
  create: async (req: Request, res: Response) => {
    try {
      const adminId = req.user?.id;

      const plan = await CustomPlanService.create(adminId, req.body);

      return res
        .status(201)
        .json(new ApiResponse(true, 201, "Custom plan created", plan));
    } catch (error) {
       console.log("Error creating custom plan:", error);
                          if(error instanceof ApiError){
                              return res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
                          }
                          return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },

  getByOrg: async (req: Request, res: Response) => {
    try {
      const { orgId } = req.params;

      const plan = await CustomPlanService.getByOrgId(orgId);

      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Plan fetched", plan));
    } catch (error) {
       console.log("Error fetching org custom plan:", error);
                          if(error instanceof ApiError){
                              return res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
                          }
                          return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { orgId } = req.params;

      const plan = await CustomPlanService.update(orgId, req.body);

      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Plan updated", plan));
    } catch (error) {
       console.log("Error updating custom plan:", error);
                          if(error instanceof ApiError){
                              return res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
                          }
                          return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },

  sendPaymentLink: async (req: Request, res: Response) => {
    try {
      const { orgId } = req.params;

      const result = await CustomPlanService.sendPaymentLink(orgId, req.body);

      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Payment link sent", result));
    } catch (error) {
       console.log("Error sending payment link:", error);
                          if(error instanceof ApiError){
                              return res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
                          }
                          return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },

  recordPayment: async (req: Request, res: Response) => {
    try {
      const { orgId } = req.params;

      const result = await CustomPlanService.recordPayment(orgId, req.body, req.user?.id);

      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Payment recorded", result));
    } catch (error) {
       console.log("Error recording payment:", error);
                          if(error instanceof ApiError){
                              return res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
                          }
                          return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },
};
export default CustomPlanController;