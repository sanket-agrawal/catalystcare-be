import express from "express";
import TestimonialController from "./testimonail.controller";

const router = express.Router();

router.get('/all',TestimonialController.fetchTestimonials);

export default router;