// therapistTestimonial.service.ts
import {prisma} from "../../../../infrastructure/prisma/client";

const TherapistTestimonialService = {
  fetchMyTestimonials: async (therapistId: string) => {
    return prisma.testimonial.findMany({
      where: {
        therapistId,
        status: "APPROVED",
        isVisible: true
      },
      select: {
        rating: true,
        text: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }
};

export default TherapistTestimonialService;
