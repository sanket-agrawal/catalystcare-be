import { Request, Response } from "express";

export const addTestimonialController = async (req : Request, res : Response) => {
  try {
    const { therapistId } = req.params;
    const { clientName, text, rating } = req.body;

    // const testimonial = await prisma.testimonial.create({
    //   data: { therapistId, clientName, text, rating },
    // });

    // res.status(201).json({ message: "Testimonial added", testimonial });
  } catch (error) {

  }
};