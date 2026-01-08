import express from "express";
import TestimonialController from "./testimonail.controller";

const router = express.Router();

router.post('/create',TestimonialController.submitTestimonial)

export default router;