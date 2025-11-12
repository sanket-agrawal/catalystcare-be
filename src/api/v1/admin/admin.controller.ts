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

            const {email , password} = req.body;
            
            const success = await adminService.adminLogin(email,password);

            res.status(200).json(
                new ApiResponse(success,success ? 200 : 400,"OTP Sent to ADMINs",success)
            )


        }catch(error){
            console.log("Error therapist login:", error); 
            if(error instanceof ApiError){
                return res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
            }
            res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
        }
    },

    adminVerifyLoginOtp : async (req : Request, res : Response) => {
        try{

            const {email, otp} = req.body;

            const token = await adminService.verifyAdminLoginOTP(email,otp);

            res.status(200).json(
                new ApiResponse(true,200,"Admin Login Success",token)
            )

        }catch(error){
            console.log("Error therapist otp verification for login:", error); 
            if(error instanceof ApiError){
                return res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
            }
            res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
        }
    },

    createComissionRate : async (req : Request, res : Response) => {
        try{
            const adminId = req.user.id;
            const commissionRate = await adminService.addCommissionRate(req.body, adminId);
            res.status(200).json(new ApiResponse(true, 201,"Commission Rate Created Successfully" , commissionRate));

        }catch(error){
            console.log("Error creating commission rate", error); 
            if(error instanceof ApiError){
                return res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
            }
            res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
        }
    }
}