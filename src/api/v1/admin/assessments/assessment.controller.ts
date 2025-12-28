import ApiError from "../../../../shared/utils/ApiError";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import { assessmentService } from "./assessment.service";


export const assessmentController = {
    createAssessment : async (req : Request, res : Response) => {
        try {
            const assessment = await assessmentService.createAssessment(req.body);
            res.status(201).json(
                new ApiResponse(
                    true,
                    201,
                    "Assessment Created Successfully",
                    assessment
                )
            )
        } catch (error) {
            console.log("Error Creating Assessment : ",error);
            if(error instanceof ApiError){
                res.status(error.statusCode).json(
                    new ApiResponse(
                        false,
                        error.statusCode,
                        error.message
                    )
                )
            }else{
                res.status(500).json(
                    new ApiResponse(
                        false,
                        500,
                        "Internal Server Error"
                    )
                )
            }
        }
    },
    updateAssessment : async (req : Request, res : Response) => {
        try {
            const { id } = req.params;
            const assessment = await assessmentService.updateAssessment(id, req.body);
            res.status(200).json(
                new ApiResponse(
                    true,
                    200,
                    "Assessment Updated Successfully",
                    assessment
                )
            )
        } catch (error) {
            console.log("Error Updating Assessment : ",error);
            if(error instanceof ApiError){
                res.status(error.statusCode).json(
                    new ApiResponse(
                        false,
                        error.statusCode,
                        error.message
                    )
                )
            }else{
                res.status(500).json(
                    new ApiResponse(
                        false,
                        500,
                        "Internal Server Error"
                    )
                )
            }
        }
    },
    publishAssessment : async (req : Request, res : Response) => {
        try {
            const { id } = req.params;
            const assessment = await assessmentService.publishAssessment(id);
            res.status(200).json(
                new ApiResponse(
                    true,
                    200,
                    "Assessment Published Successfully",
                    assessment
                )
            )
        } catch (error) {
            console.log("Error Publishing Assessment : ",error);
            if(error instanceof ApiError){
                res.status(error.statusCode).json(
                    new ApiResponse(
                        false,
                        error.statusCode,
                        error.message
                    )
                )
            }else{
                res.status(500).json(
                    new ApiResponse(
                        false,
                        500,
                        "Internal Server Error"
                    )
                )
            }
        }
    },
    unPublishAssessment : async (req : Request, res : Response) => {
        try {
            const { id } = req.params;
            const assessment = await assessmentService.unpublishAssessment(id);
            res.status(200).json(
                new ApiResponse(
                    true,
                    200,
                    "Assessment Unpublished Successfully",
                    assessment
                )
            )
        } catch (error) {
            console.log("Error unpublishing Assessment : ",error);
            if(error instanceof ApiError){
                res.status(error.statusCode).json(
                    new ApiResponse(
                        false,
                        error.statusCode,
                        error.message
                    )
                )
            }else{
                res.status(500).json(
                    new ApiResponse(
                        false,
                        500,
                        "Internal Server Error"
                    )
                )
            }
        }
    },
    getAllAssessments : async (req : Request, res : Response) => {
        try {
            const assessments = await assessmentService.getAllAssessments();
            res.status(200).json(
                new ApiResponse(
                    true,
                    200,
                    "Assessments Fetched Successfully",
                    assessments
                )
            )
        } catch (error) {
            console.log("Error Fetching All Assessment : ",error);
            if(error instanceof ApiError){
                res.status(error.statusCode).json(
                    new ApiResponse(
                        false,
                        error.statusCode,
                        error.message
                    )
                )
            }else{
                res.status(500).json(
                    new ApiResponse(
                        false,
                        500,
                        "Internal Server Error"
                    )
                )
            }
        }
    },
}