import ApiError from "../../../../shared/utils/ApiError";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import WebinarService from "./webinar.service";
import { Request, Response } from "express";

export const fetchWebinarBillings = async (req : Request, res: Response) => {
  try {
    const billings = await WebinarService.webinarBillingsDashboard();
    res.json(new ApiResponse(true, 200, "Webinar billings fetched", billings)); 
    } catch (error) {
            console.log("Error in fetching webinar billings",error);
                          if(error instanceof ApiError){
                              res.status(error.statusCode).json(
                              new ApiResponse(false,error.statusCode,error.message)
                              )
                          }else{
                              res.status(400).json(new ApiResponse(false, 400, "Something went wrong"))
                          }
    }
}