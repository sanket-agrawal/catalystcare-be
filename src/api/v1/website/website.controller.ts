import ApiError from "../../../shared/utils/ApiError";
import ApiResponse from "../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import {
  getAllCategories,
  fetchTherapistProfileService,
  fetchCategoryBySlugService,
  fetchTherapistBySlugService,
  createSlotNotificationRequestService,
} from "./website.service";

export const fetchAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await getAllCategories();
    res.status(200).json(new ApiResponse(true, 200, "Categories fetched successfully", categories));
  } catch (error) {
    console.log("Fetching Categories :", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  }
};

export const fetchTherapistProfiles = async (req: Request, res: Response) => {
  try {
    const { categoryId, subCategoryId } = req.query;
    const therapistProfiles = await fetchTherapistProfileService(
      categoryId as string,
      subCategoryId as string
    );
    res
      .status(200)
      .json(
        new ApiResponse(true, 200, "Therapist profiles fetched successfully", therapistProfiles)
      );
  } catch (error) {
    console.log("Fetching Therapist Profiles :", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  }
};

export const fetchTherapistBySlug = async (req: Request, res: Response) => {
  try {
    const therapist = await fetchTherapistBySlugService(req.params.slug);
    res
      .status(200)
      .json(new ApiResponse(true, 200, "Therapist profile fetched successfully", therapist));
  } catch (error) {
    console.log("Fetching Therapist By Id :", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  }
};

export const fetchCategoryDetailsBySlug = async (req: Request, res: Response) => {
  try {
    const category = await fetchCategoryBySlugService(req.params.slug);
    res.status(200).json(new ApiResponse(true, 200, "Category Fetched Successfully", category));
  } catch (error) {
    console.log("Error while Fetching Category by Slug :", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res.status(500).json(new ApiResponse(false, 500, "Something went wrong"));
    }
  }
};

export const fetchSubCategoryDetailsBySlug = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.log("Error while Fetching Sub Category by Slug :", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res.status(500).json(new ApiResponse(false, 500, "Something went wrong"));
    }
  }
};

export const requestSlotNotification = async (req: Request, res: Response) => {
  try {
    const { therapistId, slug } = req.params;
    const userId = req.user?.id || (req as any).user?.id;

    if (!userId) {
      throw new ApiError(401, "User authentication required to request slot notifications");
    }

    const result = await createSlotNotificationRequestService({
      therapistId: therapistId || req.body.therapistId,
      therapistSlug: slug || req.body.therapistSlug,
      userId,
    });

    res.status(201).json(new ApiResponse(true, 201, result.message, result.request));
  } catch (error) {
    console.log("Error in requestSlotNotification:", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  }
};
