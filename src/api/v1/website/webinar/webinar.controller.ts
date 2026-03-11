import ApiResponse from "../../../../shared/utils/ApiResponse";
import { fetchWebinarByIdService, initiateWebinarRegistrationService, verifyWebinarPayment } from "./webinar.service";
import ApiError from "../../../../shared/utils/ApiError";
import { Request, Response } from "express";

export const fetchWebinarById = async (req : Request, res : Response) => {
    try{
        const webinar = await fetchWebinarByIdService(req.params.id);
        res.status(200).json(
            new ApiResponse(true,200,"Webinar fetched successfully",webinar)
        )
    }catch(error){
         console.log("Error while Fetching Webinar by Id :",error);
        if(error instanceof ApiError){
            res.status(error.statusCode).json(
                new ApiResponse(false,error.statusCode,error.message)
            )
        }   else{
            res.status(500).json(
                new ApiResponse(false,500,"Something went wrong")
            )
        }  
    }
}

export const initiateWebinarRegistration = async (req : Request, res : Response) => {
    try{
        const webinar = await initiateWebinarRegistrationService(req.body.webinarId, req.body.email, req.body.name);
        res.status(200).json(
            new ApiResponse(true,200,"Webinar registration initiated successfully",webinar)
        )
    }catch(error){
         console.log("Error while creating webinar registration :",error);
        if(error instanceof ApiError){
            res.status(error.statusCode).json(
                new ApiResponse(false,error.statusCode,error.message)
            )
        }   else{
            res.status(500).json(
                new ApiResponse(false,500,"Something went wrong")
            )
        }  
    }
}

export const verifyWebinarPaymentController = async (req : Request, res : Response) => {
    try{
        const webinar = await verifyWebinarPayment(req.body);
        res.status(200).json(
            new ApiResponse(true,200,"Webinar Payment Verified successfully",webinar)
        )
    }catch(error){
         console.log("Error while verifying webinar payment :",error);
        if(error instanceof ApiError){
            res.status(error.statusCode).json(
                new ApiResponse(false,error.statusCode,error.message)
            )
        }   else{
            res.status(500).json(
                new ApiResponse(false,500,"Something went wrong")
            )
        }  
    }
}

