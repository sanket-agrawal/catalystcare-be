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
    },
    async assessmentSubmit(req: Request, res: Response) {
    try {
      const userId = req.user.id;

      const result = await clientService.assessmentSubmit(userId, req.body);

      res
        .status(200)
        .json(new ApiResponse(true, 200, "Assessment submitted successfully", result));
    } catch (error) {
      console.error("Error in submitting assessment:", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      }else {
        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"));
      }
    }
  },
  async getAssessments(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const assessments = await clientService.getAssessments(userId);

      res
        .status(200)
        .json(new ApiResponse(true, 200, "Assessments fetched successfully", assessments));
    } catch (error) {
      console.error("Error fetching assessments:", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"));
      }
    }
  },
    async getTherapistsByUserNeeds(req : Request, res : Response){
      try{
          const assessmentId = req.params.assessmentId;
          const therapists = await clientService.getTherapistByUserNeeds(req.user,assessmentId);
          res.status(200).json(
            new ApiResponse(true,200,"Therapists Fetched Successfully",therapists)
          )
      }catch(error){
        console.log("Error in Fetching Client Assesment",error)
            if(error instanceof ApiError){
                res.status(error.statusCode).json(new ApiResponse(false,error.statusCode,error.message))
            }else{
                res.status(400).json(new ApiResponse(false,400,"Something went wrong"))
            }
      }
    },
    async fetchBookings (req : Request , res : Response){
      try{
          const clientId = req.user.clientProfileId;
          const therapists = await clientService.fetchBookings(clientId);
          res.status(200).json(
            new ApiResponse(true,200,"Bookings Fetched Successfully",therapists)
          )
      }catch(error){
        console.log("Error in Fetching Client Bookings",error)
            if(error instanceof ApiError){
                res.status(error.statusCode).json(new ApiResponse(false,error.statusCode,error.message))
            }else{
                res.status(400).json(new ApiResponse(false,400,"Something went wrong"))
            }
      }
    },
    async rescheduleTherapySession( req : Request, res : Response){
      try{
           const {clientId} = req.user;
           const { bookingId, newSlotId, reason } = req.body;
           const updatedBooking = await clientService.rescheduleTherapySession(bookingId,newSlotId, clientId, reason);
           res.status(200).json(
            new ApiResponse(true, 200, 'Therapy Session Rescheduled Successfully', updatedBooking)
           )
      }catch(error){
        console.log("Error in Client Session Rescheduling",error)
            if(error instanceof ApiError){
                res.status(error.statusCode).json(new ApiResponse(false,error.statusCode,error.message))
            }else{
                res.status(400).json(new ApiResponse(false,400,"Something went wrong"))
            }
      }
    },
    async cancelTherapySession( req : Request, res : Response){
      try{
           const {clientId} = req.user;
           const { bookingId, reason } = req.body;
           await clientService.cancelTherapySession(clientId,bookingId,reason);
           res.status(200).json(
            new ApiResponse(true, 200, 'Therapy Session Cancelled Successfully')
           )
      }catch(error){
        console.log("Error in Client Session Rescheduling",error)
            if(error instanceof ApiError){
                res.status(error.statusCode).json(new ApiResponse(false,error.statusCode,error.message))
            }else{
                res.status(400).json(new ApiResponse(false,400,"Something went wrong"))
            }
      }
    },
  async pendingList (req : Request , res : Response){
      try{
          const clientId = req.user.clientProfileId;
          const therapists = await clientService.pendingList(clientId);
          res.status(200).json(
            new ApiResponse(true,200,"Client Pending List Fetched Successfully",therapists)
          )
      }catch(error){
        console.log("Error in Fetching Client Pending List",error)
            if(error instanceof ApiError){
                res.status(error.statusCode).json(new ApiResponse(false,error.statusCode,error.message))
            }else{
                res.status(400).json(new ApiResponse(false,400,"Something went wrong"))
            }
      }
    },
};