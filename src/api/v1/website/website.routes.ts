import express from "express";
import { fetchAllCategories, fetchTherapistProfiles } from "./website.controller";

const router = express.Router();

router.get('/categories',fetchAllCategories);
router.get('/therapists',fetchTherapistProfiles)

export default router;