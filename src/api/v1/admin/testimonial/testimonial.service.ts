// adminTestimonial.service.ts
import {prisma} from "../../../../infrastructure/prisma/client";
import ApiError from "../../../../shared/utils/ApiError";

const adminTestimonialService = {
  reviewTestimonial: async (
    testimonialId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    const testimonial = await prisma.testimonial.findUnique({
      where: { id: testimonialId }
    });

    if (!testimonial) {
      throw new ApiError(404, "Testimonial not found");
    }

    const updated = await prisma.testimonial.update({
      where: { id: testimonialId },
      data: {
        status,
        isVisible: status === "APPROVED"
      }
    });

    if (status === "APPROVED") {
      // Update rating aggregation synchronously
      const stats = await prisma.testimonial.aggregate({
        where: {
          therapistId: testimonial.therapistId,
          status: "APPROVED",
          isVisible: true
        },
        _avg: { rating: true },
        _count: { rating: true }
      });

      await prisma.therapistRating.upsert({
        where: { therapistId: testimonial.therapistId },
        update: {
          avgRating: stats._avg.rating ?? 0,
          totalRatings: stats._count.rating
        },
        create: {
          therapistId: testimonial.therapistId,
          avgRating: stats._avg.rating ?? 0,
          totalRatings: stats._count.rating
        }
      });
    }

    return updated;
  }
};

export default adminTestimonialService;
