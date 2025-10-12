import ApiError from "../../../shared/utils/ApiError";
import ApiResponse from "../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import { therapistService } from "./therapist.service";

export const therapistController = {
    async registeration(req : Request, res : Response){
        try {
            const therapist = await therapistService.register(req.user.id, req.body,req.user.email,req.user.firstName);
            res.status(201).json(
                new ApiResponse(true,201,"Therapist Registered Successfully")
            )
        }catch (error) {
            console.log("Therapist Registeration :",error);
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