import express from "express"
import { fetchWebinarById } from "./webinar.controller";

const router = express.Router();

router.get('/:id',fetchWebinarById);

export default router;