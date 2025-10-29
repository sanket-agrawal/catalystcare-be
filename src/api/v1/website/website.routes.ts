import express from "express";
import { fetchAllCategories, fetchCategoryDetailsById, fetchTherapistProfiles } from "./website.controller";

const router = express.Router();

router.get('/categories',fetchAllCategories);
router.get('/therapists',fetchTherapistProfiles);
router.get('/category/:categoryId',fetchCategoryDetailsById)

export default router;