import ApiError from "../../../../shared/utils/ApiError";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import ClientSessionService from "./session.service";

const ClientSessionController = {
    rescheduleSession : async (req : Request , res : Response) => {
       try{
            const {bookingId , newSlotId } = req.body;
            const clientId = req.user.clientProfileId;
            const rescheduledSession = await ClientSessionService.rescheduleTherapySession(bookingId,newSlotId,clientId);
            return res.status(200).json(
                new ApiResponse(true,200,"Session rescheduled successfully",rescheduledSession)
            )
       }catch(error){
        console.log("Error while client rescheduling session:",error);
        if(error instanceof ApiError){
            return res.status(error.statusCode).json(
                new ApiResponse(false,error.statusCode,error.message)
            )
        }

        return res.status(500).json(
            new ApiResponse(false,500,"Internal Server Error")
        )
       }
    }
}

export default ClientSessionController;