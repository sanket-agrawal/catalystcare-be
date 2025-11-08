import ApiError from "../../../shared/utils/ApiError";
import ApiResponse from "../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import { therapistService } from "./therapist.service";

export const therapistController = {
    async registeration(req : Request, res : Response){
        try {
            const therapist = await therapistService.register(req.user.id, req.body,req.user.email,req.user.firstName, req.user.lastName);
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
},
async profile(req : Request, res : Response) {
    try{
        const {therapistProfileId} = req.user;
        const profile = await therapistService.profile(therapistProfileId);
        res.status(200).json(
            new ApiResponse(true,200,"Therapist Profile fetched successfully",profile)
        )
    }catch(error){
        console.log("Error fetching therapist profile",error);
        if(error instanceof ApiError){
            res.status(error.statusCode).json( 
                new ApiResponse(false,error.statusCode,error.message)
            )
        }else{
            res.status(400).json(
                new ApiResponse(false,400,"Internal Server Error")
            )
        }
    }
},
async fetchBookings (req : Request, res : Response){
    try{
          const {therapistProfileId} = req.user;
       const bookings = await therapistService.fetchBookings(therapistProfileId);
    }catch(error){
        console.log("Error fetching therapist bookings",error);
        if(error instanceof ApiError){
            res.status(error.statusCode).json( 
                new ApiResponse(false,error.statusCode,error.message)
            )
        }else{
            res.status(400).json(
                new ApiResponse(false,400,"Internal Server Error")
            )
        }
    }
}
}