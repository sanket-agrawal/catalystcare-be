import ApiError from "../../../../shared/utils/ApiError";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import { Request, Response } from "express";
import programPaymentService from "./programPayment.service";

  
 const ProgramPurchaseController = { 
  createProgramBookingOrder : async function (req : Request, res : Response){
    try{
       const {clientId, programId } = req.body;
       const order = await programPaymentService.createProgramBookingOrder(clientId,programId);
       res.status(200).json(new ApiResponse(true,200,"Program Order Created Successfully",order))
    }catch(error){
      console.error(error);
      if (error instanceof ApiError)
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      else res.status(400).json(new ApiResponse(false, 400, "Something went wrong"));
    }
  }
};

export default ProgramPurchaseController;