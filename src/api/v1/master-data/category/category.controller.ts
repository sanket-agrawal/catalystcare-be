import { Request, Response } from "express";
import ApiError from "../../../../shared/utils/ApiError";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import { createCategoryService } from "./category.service";

export const createCategory = async (req: Request, res : Response) => {
  try {
    const { name, description, imageUrl } = req.body;
    const category = await createCategoryService({ name, description });
    res.status(201).json(
        new ApiResponse(true,201,"Category created successfully",category)
    )
  } catch (error) {
    console.log("Creating Category :",error);
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