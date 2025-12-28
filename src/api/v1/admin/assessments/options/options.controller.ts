import { Request, Response } from "express";
import { assessmentOptionService } from "./option.service";
import ApiResponse from "../../../../../shared/utils/ApiResponse";
import ApiError from "../../../../../shared/utils/ApiError";

export const OptionController = {
    createOption : async (req : Request, res : Response) => {
        try{
            const { questionId, label, weight, order } = req.body;    
            const option = await assessmentOptionService.createOption({
                questionId,
                label,
                weight,
                order
            });
            res.status(201).json(
                new ApiResponse(true,201,"Option created successfully",option)
            )
        }catch(error){
            console.log("Error creating option:",error);
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
    },
    updateOption : async (req : Request, res : Response) => {
        try{    
            const { id } = req.params;
            const { label, weight, order } = req.body;
            const option = await assessmentOptionService.updateOption(id,{
                label,
                weight,
                order
            });
            res.status(200).json(
                new ApiResponse(true,200,"Option updated successfully",option)
            )
        }catch(error){
            console.log("Error updating option:",error);
            if(error instanceof ApiError){
                res.status(error.statusCode).json(
                    new ApiResponse(false,error.statusCode,error.message)
                )
            }   
            else{
                res.status(500).json(
                    new ApiResponse(false,500,"Internal Server Error")
                )
            }
        }
    },
    deleteOption : async (req : Request, res : Response) => {
        try{
            const { id } = req.params;
            const option = await assessmentOptionService.deleteOption(id);
            res.status(200).json(
                new ApiResponse(true,200,"Option deleted successfully",option)
            )
        }catch(error){
            console.log("Error deleting option:",error);
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

}