import ApiError from "../../../shared/utils/ApiError";
import ApiResponse from "../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import { clientService } from "./client.service";

export const clientController = {

    async profileUpdate(req : Request, res : Response) {
        try{
            const updatedProfile = await clientService.profileUpdate(req.user, req.body);
            res.status(200).json(
                new ApiResponse(true,20,"Profile Updated Sucessfully",updatedProfile)
            )

        }catch(error){
            console.log("Error in Client Profile Update",error)
            if(error instanceof ApiError){
                res.status(error.statusCode).json(new ApiResponse(false,error.statusCode,error.message))
            }else{
                res.status(400).json(new ApiResponse(false,400,"Something went wrong"))
            }
        }
    }
};