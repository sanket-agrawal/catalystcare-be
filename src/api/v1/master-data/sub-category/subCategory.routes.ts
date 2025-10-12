import express from "express";
import { createSubCategory } from "./subCategory.controller";

const router = express.Router();

router.post("/", createSubCategory);

export default router;