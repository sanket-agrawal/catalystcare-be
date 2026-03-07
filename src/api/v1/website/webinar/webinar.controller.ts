import ApiResponse from "../../../../shared/utils/ApiResponse";
import { fetchWebinarByIdService } from "./webinar.service";
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