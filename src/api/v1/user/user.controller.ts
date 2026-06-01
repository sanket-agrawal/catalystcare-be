import ApiResponse from "../../../shared/utils/ApiResponse";
import ApiError from "../../../shared/utils/ApiError";
import { Request, Response } from "express";
import { userService } from "./user.service";

export const userProfile = async (req: Request, res: Response) => {
  try {
    const user = await userService.userProfileService(req.user);
    res.status(200).json(new ApiResponse(true, 200, "User profile fetched successfully", user));
  } catch (error) {
    console.log("Fetching user profile failed", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res
        .status(500)
        .json(new ApiResponse(false, 500, "Something went wrong while fetching user profile"));
    }
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const updateData = req.body;
    const updatedUser = await userService.updateUserProfileService(req.user, updateData);
    res
      .status(200)
      .json(new ApiResponse(true, 200, "User profile updated successfully", updatedUser));
  } catch (error) {
    console.log("updating user profile failed", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res
        .status(500)
        .json(new ApiResponse(false, 500, "Something went wrong while fetching user profile"));
    }
  }
};

export const extensionDashboard = async (req: Request, res: Response) => {
  try {
    const dashboardData = await userService.extensionDashboardService(req.user);
    res
      .status(200)
      .json(
        new ApiResponse(true, 200, "Extension dashboard data fetched successfully", dashboardData)
      );
  } catch (error) {
    console.log("Fetching extension dashboard failed", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res
        .status(500)
        .json(
          new ApiResponse(false, 500, "Something went wrong while fetching extension dashboard")
        );
    }
  }
};
