import { assessmentService } from "../../admin/assessments/assessment.service";
import { prisma } from "../../../../infrastructure/prisma/client";
import ApiError from "../../../../shared/utils/ApiError";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import { Request, Response } from "express";

export const AssessmentController = {
    fetchAllAssessments : async (req : Request, res : Response) => {
        try{
            const assessments = await prisma.assessment.findMany({
                where : {
                    isActive : true
                },
                select : {
                    slug : true,
                    title : true,
                    description : true,
                    icon : true,
                    poster : true,
                    verifiedBy : true,
                    questions : {
                        orderBy : {
                            order : 'asc'
                        },
                        select : {
                            id : true,
                            text : true,
                            order : true,
                            options : {
                                orderBy : {
                                    order : 'asc'
                                },
                                select : {
                                    id : true,
                                    label : true,
                                    order : true,
                                    weight : true
                                }
                            }
                        },
                    }
                }
            });

            res.status(200).json(
                new ApiResponse(true,200,"Assessments fetched successfully",assessments)
            )
        }catch(error){
            console.log("Error fetching assessments : ", error);
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
    fetchAssessmentBySlug : async (req : Request, res : Response)=> {
        try{
            const { slug } = req.params;
            const assessment = await prisma.assessment.findFirst({
                where : {
                    slug,
                    isActive : true
                },
                select : {
                    slug : true,
                    title : true,
                    description : true,
                    icon : true,
                    poster : true,
                    verifiedBy : true,
                    targetAudience : true,
                    guidelines : true,
                    questions : {
                        orderBy : {order : 'asc'},
                        select : {
                            id : true,
                            text : true,
                            order : true,
                            options : {
                                orderBy : {order : 'asc'},
                                select : {
                                    id : true,
                                    label : true,
                                    order : true,
                                    weight : true
                                }
                            }
                        },
                    }
                }
            });
            if(!assessment){
                throw new ApiError(404,"Assessment not found");
            }
            res.status(200).json(
                new ApiResponse(true,200,"Assessment fetched successfully",assessment)
            )
        }catch(error){
             console.log("Error fetching assessment by Slug : ", error);
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
    submitAssessment : async (req : Request , res : Response) => {
        try {
            const result = await assessmentService.submitAssessment(req.body);

            res.status(200).json(
                new ApiResponse(
                    true,
                    200,
                    "Assessment submitted successfully",
                    result
                )
            )
            
        } catch (error) {
            console.log("Error submiting assessments : ", error);
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