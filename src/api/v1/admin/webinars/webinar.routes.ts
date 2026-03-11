import express from "express"
import { fetchWebinarBillings } from "./webinar.controller";

const router = express.Router();

router.get('/billings',fetchWebinarBillings);

export default router;