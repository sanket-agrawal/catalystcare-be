import express from "express";
import {createCategory} from "./category.controller";

const router = express.Router();

router.post("/", createCategory);

export default router;