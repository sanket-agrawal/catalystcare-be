import { Request, Response } from "express";
import adminTestimonialService from "./testimonial.service";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import ApiError from "../../../../shared/utils/ApiError";

const TestimonialController = {
 reviewTestimonial: async (req: Request, res: Response) => {
    try {
      const { testimonialId } = req.params;
      const { status } = req.body; // APPROVED | REJECTED

      const result = await adminTestimonialService.reviewTestimonial(
        testimonialId,
        status
      );

      return res.status(200).json(
        new ApiResponse(true, 200, "Testimonial updated", result)
      );
    } catch (error) {
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