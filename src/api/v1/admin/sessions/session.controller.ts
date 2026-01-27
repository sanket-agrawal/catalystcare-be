import ApiError from "../../../../shared/utils/ApiError";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import AdminSessionService from "./session.service";

const AdminSessionController =  {
fetchRescheduleRequests : async (req : Request, res : Response) => {
    try{
           const bookings = await AdminSessionService.fetchRescheduleRequests();

           return res.status(200).json(new ApiResponse(true, 200, "Rescheduled bookings fetched successfully", bookings));
    }catch(error){
console.log("Error fetching rescheduled bookings:", error);
            if(error instanceof ApiError){
                return res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
            }
            return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
},
processRescheduleRequest : async (req : Request, res : Response) => {
    try{
       const {bookingId, newSlotId,action} = req.body;

       if(action){
        if(!newSlotId){
            return res.status(400).json(new ApiResponse(false,400,"New slot ID is required for approving reschedule request"));
        }
       }
       const processedAction = await AdminSessionService.processRescheduleRequest(bookingId, newSlotId, req.user.id,action);
       return res.status(200).json(new ApiResponse(true, 200, "Rescheduled bookings processed successfully", processedAction));
    }catch(error){
console.log("Error processing reschedule request:", error);
            if(error instanceof ApiError){
                return res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
            }
            return res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
}
};
export default AdminSessionController;