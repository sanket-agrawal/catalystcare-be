import express from "express";
import TestimonialController from "./testimonail.controller";

const router = express.Router();

router.post('/review/:testimonialId',TestimonialController.reviewTestimonial)

export default router;