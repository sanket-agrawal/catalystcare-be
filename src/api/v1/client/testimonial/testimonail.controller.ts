// testimonial.controller.ts
import { Request, Response } from "express";
import ApiError from "../../../../shared/utils/ApiError";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import testimonialService from "./testimonial.service"

const TestimonialController = {
  submitTestimonial: async (req: Request, res: Response) => {
    try {
      const clientId = req.user.clientProfileId;
      const { bookingId, rating, text } = req.body;

      const testimonial = await testimonialService.submitTestimonial({
        clientId,
        bookingId,
        rating,
        text
      });

      return res.status(200).json(
        new ApiResponse(true, 200, "Testimonial submitted successfully", testimonial)
      );
    } catch (error) {
      console.log(error)
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(
          new ApiResponse(false, error.statusCode, error.message)
        );
      }
      return res.status(500).json(
        new ApiResponse(false, 500, "Something went wrong")
      );
    }
  }
};

export default TestimonialController;
