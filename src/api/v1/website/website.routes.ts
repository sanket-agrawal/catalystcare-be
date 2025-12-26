import express from "express";
import { fetchAllCategories, fetchCategoryDetailsBySlug, fetchTherapistBySlug, fetchTherapistProfiles } from "./website.controller";
import { createContact } from "../../../infrastructure/mongodb/controllers/contact.controller";
import assessmentRoutes from "./assessments/assessment.routes";
const router = express.Router();

router.get('/categories',fetchAllCategories);
router.get('/therapists',fetchTherapistProfiles);
router.get('/category/:slug',fetchCategoryDetailsBySlug);
router.get('/therapist/:slug',fetchTherapistBySlug);
router.post('/contact',createContact);
router.use('/assessments', assessmentRoutes);

export default router;