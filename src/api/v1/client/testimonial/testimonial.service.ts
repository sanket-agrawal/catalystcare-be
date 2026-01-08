// testimonial.service.ts
import {prisma} from "../../../../infrastructure/prisma/client";
import ApiError from "../../../../shared/utils/ApiError";

interface SubmitTestimonialPayload {
  clientId: string;
  bookingId: string;
  rating: number;
  text?: string;
}

const testimonialService = {
  submitTestimonial: async ({
    clientId,
    bookingId,
    rating,
    text
  }: SubmitTestimonialPayload) => {
    if (rating < 1 || rating > 5) {
      throw new ApiError(400, "Rating must be between 1 and 5");
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        clientId,
        paymentStatus: "CAPTURED",
        status: "CONFIRMED"
      }
    });

    if (!booking) {
      throw new ApiError(404, "Booking not found or not eligible for rating");
    }

    if (new Date() < booking.endDateTime) {
      throw new ApiError(400, "Session not completed yet");
    }

    const existing = await prisma.testimonial.findUnique({
      where: { bookingId }
    });

    if(existing) throw new ApiError(400,'Review Already Submitted')


    return prisma.testimonial.create({
      data: {
        bookingId,
        clientId,
        therapistId: booking.therapistId,
        rating,
        text,
        status: "PENDING",
        isVisible: false
      }
    });
  }
};

export default testimonialService;
