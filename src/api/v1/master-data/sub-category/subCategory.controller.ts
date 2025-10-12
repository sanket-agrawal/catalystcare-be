import ApiError from "../../../../shared/utils/ApiError";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import { createSubCategoryService } from "./subCategory.service";

export const createSubCategory = async (req: Request, res : Response) => {
  try {
    const { name, description, categoryId } = req.body;
    const category = await createSubCategoryService({ name, description, categoryId });
    res.status(201).json(
        new ApiResponse(true,201,"Sub Category created successfully",category)
    )
  } catch (error) {
    console.log("Creating Sub Category :",error);
    if(error instanceof ApiError){
        res.status(error.statusCode).json(
            new ApiResponse(false,error.statusCode,error.message)
        )
    }else{
        res.status(500).json(
            new ApiResponse(false,500,"Internal Server Error")
        )
    }
  }
}