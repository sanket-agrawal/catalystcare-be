import ApiError from "../../../shared/utils/ApiError";
import ApiResponse from "../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import { adminService } from "./admin.service";

export const adminController = {

    fetchTherapistProfiles : async (req : Request, res : Response) => {
        try {
            const therapistProfiles = await adminService.getAllTherapistProfiles();
            res.status(200).json(new ApiResponse(true, 200, "Therapist profiles fetched successfully", therapistProfiles));
        } catch (error) {
            console.log("Error fetching therapist profiles:", error);
            if(error instanceof ApiError){
                res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
            }
            res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
        }
    },

    approveRejectTherapistProfile : async (req : Request, res : Response) => {
        try {
            const { profileId } = req.params;
            const { approve } = req.body;
            if (typeof approve !== 'boolean') {
                return res.status(400).json(new ApiResponse(false, 400, "'approve' must be a boolean"));
            }
            const updatedProfile = await adminService.approveRejectTherapistProfile(profileId, approve);
            res.status(200).json(new ApiResponse(true, 200, `Therapist profile ${approve ? 'approved' : 'rejected'} successfully`, updatedProfile));
        } catch (error) {
            console.log("Error approving/rejecting therapist profile:", error); 
            if(error instanceof ApiError){
                return res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
            }
            res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
        }
    },

    adminLogin : async (req : Request , res : Response) => {
        try{

        }catch(error){
            console.log("Error therapist login:", error); 
            if(error instanceof ApiError){
                return res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
            }
            res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
        }
    }
}