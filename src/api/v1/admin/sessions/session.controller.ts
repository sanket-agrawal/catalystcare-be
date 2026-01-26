import ApiError from "../../../../shared/utils/ApiError";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import AdminSessionService from "./session.service";

const AdminSessionController =  {
fetchRescheduleRequests : async (req : Request, res : Response) => {
    try{
           const bookings = await AdminSessionService.fetchRescheduleRequests();

           res.status(200).json(new ApiResponse(true, 200, "Rescheduled bookings fetched successfully", bookings));
    }catch(error){
console.log("Error fetching rescheduled bookings:", error);
            if(error instanceof ApiError){
                res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
            }
            res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
},
processRescheduleRequest : async (req : Request, res : Response) => {
    try{

    }catch(error){

    }
}
};
export default AdminSessionController;