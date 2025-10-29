import ApiError from "../../../shared/utils/ApiError";
import ApiResponse from "../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import { getAllCategories,fetchTherapistProfileService, fetchCategoryById } from "./website.service";

export const fetchAllCategories = async (req : Request, res : Response) => {
    try {
        const categories = await getAllCategories();
        res.status(200).json(
            new ApiResponse(true,200,"Categories fetched successfully",categories)
        )
    } catch (error) {
        console.log("Fetching Categories :",error);
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

export const fetchTherapistProfiles = async (req : Request, res : Response) => {
    try {
        const {categoryId , subCategoryId} = req.query
        const therapistProfiles = await fetchTherapistProfileService(categoryId as string,subCategoryId as string);
        res.status(200).json(
            new ApiResponse(true,200,"Therapist profiles fetched successfully",therapistProfiles)
        )   
    } catch (error) {
        console.log("Fetching Therapist Profiles :",error);
        if(error instanceof ApiError){
            res.status(error.statusCode).json(
                new ApiResponse(false,error.statusCode,error.message)
            )
        }   else{
            res.status(500).json(
                new ApiResponse(false,500,"Internal Server Error")
            )
        }       
    }
}

export const fetchTherapistById = async (req : Request, res : Response) => {        
    try {
        res.status(200).json(
            new ApiResponse(true,200,"Therapist profile fetched successfully",{})
        )   
    }catch (error) {
        console.log("Fetching Therapist By Id :",error);
        if(error instanceof ApiError){
            res.status(error.statusCode).json(
                new ApiResponse(false,error.statusCode,error.message)
            )
        }   else{
            res.status(500).json(
                new ApiResponse(false,500,"Internal Server Error")
            )
        }   
    }
}

export const fetchCategoryDetailsById = async (req : Request, res : Response) => {
    try {
        const category = await fetchCategoryById(req.params.categoryId);
        res.status(200).json(
            new ApiResponse(true,200,"Category Fetched Successfully",category)
        )
    } catch (error) {
         console.log("Error while Fetching Category by ID :",error);
        if(error instanceof ApiError){
            res.status(error.statusCode).json(
                new ApiResponse(false,error.statusCode,error.message)
            )
        }   else{
            res.status(500).json(
                new ApiResponse(false,500,"Internal Server Error")
            )
        }  
    }
}