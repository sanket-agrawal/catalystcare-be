import express from "express";
import { fetchAllCategories } from "./website.controller";

const router = express.Router();

router.get('/categories',fetchAllCategories);

export default router;