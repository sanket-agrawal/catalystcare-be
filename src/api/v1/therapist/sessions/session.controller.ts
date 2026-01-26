import ApiError from "../../../../shared/utils/ApiError";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import TherapistSessionService from "./session.service";

const TherapistSessionController = {
    rescheduleSession : async (req : Request , res : Response) => {
       try{
            const {bookingId } = req.body;
            const therapistId = req.user.therapistProfileId;
            const rescheduledSession = await TherapistSessionService.rescheduleSession(bookingId,therapistId);
            return res.status(200).json(
                new ApiResponse(true,200,"Session Rescheduling Request successfully",rescheduledSession)
            )
       }catch(error){
        console.log("Error while therapist rescheduling session:",error);
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
};

export default TherapistSessionController;