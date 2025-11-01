import express from "express";
import { fetchAllCategories, fetchCategoryDetailsBySlug, fetchTherapistBySlug, fetchTherapistProfiles } from "./website.controller";

const router = express.Router();

router.get('/categories',fetchAllCategories);
router.get('/therapists',fetchTherapistProfiles);
router.get('/category/:slug',fetchCategoryDetailsBySlug);
router.get('/therapist/:slug',fetchTherapistBySlug)

export default router;