import { Request, Response } from "express";
import { programBookingService } from "./programBooking.service";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import ApiError from "../../../../shared/utils/ApiError";

const ProgramBookingController = {
    fetchProgramBookings :  async (req : Request, res : Response) => {
      try{
            const bookings = await programBookingService.fetchProgramPurchases(req.user.clientProfileId);
            res.status(200).json(
                new ApiResponse(true,200,"Program Bookings Fetched Successfully",bookings)
            )
        }catch(error){
            console.log("error in fetching client program bookings",error);
            if(error instanceof ApiError){
                res.status(error.statusCode).json(
                    new ApiResponse(false,error.statusCode,error.message)
                )
            }else{
                res.status(400).json(
                    new ApiResponse(false,400,"Something Went Wrong")
                )
            }
        }
    },
    bookSlot : async (req : Request, res : Response) => {
        try{
            const {programPurchaseId, slotId} = req.body;
            const bookings = await programBookingService.bookSlot(req.user.clientProfileId,programPurchaseId,slotId);
            res.status(200).json(
                new ApiResponse(true,200,"Slot Booked Successfully",bookings)
            )
        }catch(error){
            console.log("error in booking program slot client",error);
            if(error instanceof ApiError){
                res.status(error.statusCode).json(
                    new ApiResponse(false,error.statusCode,error.message)
                )
            }else{
                res.status(400).json(
                    new ApiResponse(false,400,"Something Went Wrong")
                )
            } 
        }
    }

}

export default ProgramBookingController;