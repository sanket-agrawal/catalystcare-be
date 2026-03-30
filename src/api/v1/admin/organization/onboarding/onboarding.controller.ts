import ApiError from "../../../../../shared/utils/ApiError";
import ApiResponse from "../../../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import OnboardingService from "./onboarding.service";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

const OnboardingController = {
    fetchOnboardingRequests : async (req : Request, res : Response) => {
        try{
            const {status} = req.query;

            const onboardingRequests = await OnboardingService.fetchOnboardingRequests(status as string)
            
            return res.status(200).json(new ApiResponse(true, 200, "Onboarding requests fetched successfully", onboardingRequests));

        }catch(error){
        console.log("Error fetching onboarding requests:", error);
                    if(error instanceof ApiError){
                        return res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
                    }
                    return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
            }
    },
    createOrganization : async (req : Request, res : Response) => {
        try{
             
            const organization = await OnboardingService.createOrganization(req.body);
            return res.status(201).json(new ApiResponse(true,201,"Organization created successfully",organization))


        }catch(error){
        console.log("Error creating organization:", error);
         if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            const field = (error.meta?.target as string[])?.join(", ");

            return res.status(400).json(
                new ApiResponse(false, 400, `${field} already exists`)
            );
        }
    }
                    if(error instanceof ApiError){
                        return res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
                    }

                    return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
            }
    },
    updateOrganization : async (req : Request, res : Response) => {
        try{
            
           const organization = await OnboardingService.updateOrganization(req.params.id, req.body);
            return res.status(200).json(new ApiResponse(true,200,"Organization updated successfully",organization))

        }catch(error){
        console.log("Error updating organization:", error);
                 if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            const field = (error.meta?.target as string[])?.join(", ");

            return res.status(400).json(
                new ApiResponse(false, 400, `${field} already exists`)
            );
        }
    }
                    if(error instanceof ApiError){
                        return res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
                    }
                    return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
            }
    },
        fetchOrganization : async (req : Request, res : Response) => {
        try{

            const {status} = req.query;
            


        }catch(error){
        console.log("Error fetching organizations:", error);
                    if(error instanceof ApiError){
                        return res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
                    }
                    return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
            }
    },
    fetchOrganizationById : async (req : Request, res : Response) => {
        try{
            


        }catch(error){
        console.log("Error fetching organization by id:", error);
                    if(error instanceof ApiError){
                        return res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
                    }

                    return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
            }
    },
};

export default OnboardingController;