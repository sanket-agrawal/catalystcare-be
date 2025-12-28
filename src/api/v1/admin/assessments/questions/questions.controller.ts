import ApiError from "../../../../../shared/utils/ApiError";
import ApiResponse from "../../../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import { assessmentQuestionService } from "./question.service";

export const QuestionController = {
    createQuestion : async (req : Request, res : Response) => {
        try{
            const { assessmentId, text, order, category } = req.body;
            const question = await assessmentQuestionService.createQuestion({
                assessmentId,
                text,
                order,
                category
            });
            res.status(201).json(
                new ApiResponse(true,201,"Question created successfully",question)
            )
        }catch(error){
            console.log("Error creating question:",error);
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
    updateQuestion : async (req : Request, res : Response) => {
        try{
            const { id } = req.params;
            const { text, order, category, isActive } = req.body;
            const question = await assessmentQuestionService.updateQuestion(id,{
                text,
                order,
                category,
                isActive
            });
            res.status(200).json(
                new ApiResponse(true,200,"Question updated successfully",question)
            )
        }catch(error){
            console.log("Error updating question:",error);
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
    deleteQuestion : async (req : Request, res : Response) => {
        try{
            const { id } = req.params;
            const question = await assessmentQuestionService.deleteQuestion(id);
            res.status(200).json(
                new ApiResponse(true,200,"Question deleted successfully",question)
            )
        }catch(error){
            console.log("Error deleting question:",error);
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