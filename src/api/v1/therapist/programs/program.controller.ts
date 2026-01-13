import ApiError from "../../../../shared/utils/ApiError";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import ProgramService from "./program.service";

const ProgramController = {

    createProgram : async (req : Request, res : Response) => {
        try{
            const program = await ProgramService.createProgram(req.user.therapistProfileId,req.body);
            res.status(201).json(
                new ApiResponse(true,201,"Program Created Successfully",program)
            )
            
        }catch(error){
             console.log("Error in Create Program",error);
                  if(error instanceof ApiError){
                    res.status(error.statusCode).json(
                      new ApiResponse(false,error.statusCode,error.message)
                    )
                  }else{
                    res.status(400).json(new ApiResponse(false, 400, "Something went wrong"))
                  }
        }
    },
    fetchAllPrograms :async (req : Request, res : Response) => {
        try{
            const programs = await ProgramService.fetchAllPrograms(req.user.therapistProfileId);
            res.status(201).json(
                new ApiResponse(true,201,"Program Fetched Successfully",programs)
            )
            
        }catch(error){
             console.log("Error in Fttching Programs",error);
                  if(error instanceof ApiError){
                    res.status(error.statusCode).json(
                      new ApiResponse(false,error.statusCode,error.message)
                    )
                  }else{
                    res.status(400).json(new ApiResponse(false, 400, "Something went wrong"))
                  }
        }
    },
    updateProgram : async (req : Request, res : Response) => {
        try{
            const updatedProgram = await ProgramService.updateProgram(req.params.programId,req.user.therapistProfileId,req.body);
            res.status(200).json(
                new ApiResponse(true,200,"Program Updated Successfully",updatedProgram)
            )
        }catch(error){
             console.log("Error in Update Program",error);
                  if(error instanceof ApiError){
                    res.status(error.statusCode).json(
                      new ApiResponse(false,error.statusCode,error.message)
                    )
                  }else{
                    res.status(400).json(new ApiResponse(false, 400, "Something went wrong"))
                  }
        }
    },
    publishProgram : async (req : Request, res : Response) => {
        try{
            const publishedProgram = await ProgramService.publishProgram(req.params.programId,req.user.therapistProfileId);
            res.status(200).json(
                new ApiResponse(true,200,"Program Published Successfully",publishedProgram)
            )
        }catch(error){
             console.log("Error in Publish Program",error);
                  if(error instanceof ApiError){
                    res.status(error.statusCode).json(
                      new ApiResponse(false,error.statusCode,error.message)
                    )
                  }else{
                    res.status(400).json(new ApiResponse(false, 400, "Something went wrong"))
                  }
        }
    },
    unPublishProgram : async (req : Request, res : Response) => {
        try{
            const unPublishedProgram = await ProgramService.unPublishProgram(req.params.programId,req.user.therapistProfileId);
            res.status(200).json(
                new ApiResponse(true,200,"Program Un-Published Successfully",unPublishedProgram)
            )
        }catch(error){
             console.log("Error in Un Publish Program",error);
                  if(error instanceof ApiError){
                    res.status(error.statusCode).json(
                      new ApiResponse(false,error.statusCode,error.message)
                    )
                  }else{
                    res.status(400).json(new ApiResponse(false, 400, "Something went wrong"))
                  }
        }
    },
    addPlanToProgram : async (req : Request, res : Response) => {
        try{
            const plan = await ProgramService.addPlanToProgram(req.params.programId,req.user.therapistProfileId,req.body);
            res.status(200).json(
                new ApiResponse(true,200,"Plan Added to Program Successfully",plan)
            )

        }catch(error){
             console.log("Error in Add Plan To Program",error);
                    if(error instanceof ApiError){
                        res.status(error.statusCode).json(
                        new ApiResponse(false,error.statusCode,error.message)
                        )
                    }else{
                        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"))
                    }
        }
    },
    publishPlan : async (req : Request, res : Response) => {
        try{
            const plan = await ProgramService.publishPlan(req.params.planId,req.user.therapistProfileId);
            res.status(200).json(
                new ApiResponse(true,200,"Plan Published Successfully",plan)
            )
        }catch(error){
             console.log("Error in Add Plan To Program",error);
                    if(error instanceof ApiError){
                        res.status(error.statusCode).json(
                        new ApiResponse(false,error.statusCode,error.message)
                        )
                    }else{
                        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"))
                    }
        }
    },
    unPublishPlan : async (req : Request, res : Response) => {
        try{
            const plan = await ProgramService.unPublishPlan(req.params.planId,req.user.therapistProfileId);
            res.status(200).json(
                new ApiResponse(true,200,"Plan Un-Published Successfully",plan)
            )
        }catch(error){
            console.log("Error in Unpublish Plan",error);
                    if(error instanceof ApiError){
                        res.status(error.statusCode).json(
                        new ApiResponse(false,error.statusCode,error.message)
                        )
                    }else{
                        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"))
                    }
        }},
    fetchProgramBookings :async (req : Request, res : Response) => {
        try{
            const plan = await ProgramService.fetchProgramBookings(req.user.therapistProfileId);
            res.status(200).json(
                new ApiResponse(true,200,"Program Bookings fetched Successfully",plan)
            )
        }catch(error){
            console.log("Error in Fetching therapist program bookings",error);
                    if(error instanceof ApiError){
                        res.status(error.statusCode).json(
                        new ApiResponse(false,error.statusCode,error.message)
                        )
                    }else{
                        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"))
                    }
        }},
};

export default ProgramController;