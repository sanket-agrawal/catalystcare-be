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
       res.status(200).json(new ApiResponse(true,200,"Therapist Booking Fetched Successfully",bookings))
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
},
async setUPIVPA (req : Request , res : Response){
    try{
           const {therapistProfileId} = req.user;
           const updatedDetails = await therapistService.setTherapistUpiVpa(therapistProfileId,req.body.vpa);
        res.status(200).json(
            new ApiResponse(true,200,"Therapist VPA updated successfully",updatedDetails)
        )
    }catch(error){
         console.log("Error seting therapist VPA",error);
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
async fetchMaskedVPA (req : Request, res : Response){
    try{
        const {therapistProfileId} = req.user;
        const maskedVPA = await therapistService.fetchTherapistMaskedVpa(therapistProfileId);
        res.status(200).json(
            new ApiResponse(true,200,"Masked VPA Fetched Successfully",maskedVPA)
        );
    }catch(error){
        console.log("Error fetching therapist Masked VPA",error);
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
async therapistBillingDashboard(req : Request, res : Response){
try{
    const {therapistProfileId} = req.user;
   const billings = await therapistService.therapistBillingDashboard(therapistProfileId);
   res.status(200).json(
    new ApiResponse(true,200,"Therapist Billing Dashboard Fetched Success",billings)
   )
}catch(error){
    console.log("Error fetching therapist billing dashboard",error);
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
async updateTherapistProfile (req : Request , res : Response){{
    try{
        const {therapistProfileId} = req.user;
        const updatedProfile = await therapistService.updateTherapistProfile(therapistProfileId, req.body);
        res.status(200).json(
            new ApiResponse(true,200,"Therapist Profile Updated Successfully",updatedProfile)
        )
    }catch(error){
        console.log("Error updating therapist profile",error);
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
}}