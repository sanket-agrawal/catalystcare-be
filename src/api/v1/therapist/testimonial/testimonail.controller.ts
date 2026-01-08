import { Request, Response } from "express";
import TherapistTestimonialService from "./testimonial.service";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import ApiError from "../../../../shared/utils/ApiError";

const TestimonialController = {

  fetchTestimonials : async (req : Request, res : Response) => {
    try{
      const {therapistProfileId} = req.user;
      const testimonials = await TherapistTestimonialService.fetchMyTestimonials(therapistProfileId);
      res.status(200).json(
        new ApiResponse(true,200,"Testimonials Fetched Successfully",testimonials)
    )
    }catch(error){
      console.log(error);
      if(error instanceof ApiError){
        res.status(error.statusCode).json(
          new ApiResponse(false,error.statusCode,error.message)
        )
      }
      res.status(400).json(
        new ApiResponse(false,400,"Internal Server Error")
      )
    }
  }

};

export default TestimonialController;