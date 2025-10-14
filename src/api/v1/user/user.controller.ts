import ApiResponse from "../../../shared/utils/ApiResponse";
import ApiError from "../../../shared/utils/ApiError";
import { Request, Response } from "express";
import { userService } from "./user.service";

export const userProfile = async (req : Request, res : Response) => {
    try {
       const user = await userService.userProfileService(req.user);
       res.status(200).json(new ApiResponse(true, 200,"User profile fetched successfully",user));
       
    }catch (error) {
        console.log('Fetching user profile failed', error);
        if(error instanceof ApiError){
            res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
        }else{
            res.status(500).json(new ApiResponse(false, 500,"Something went wrong while fetching user profile"));
        }
    }
}