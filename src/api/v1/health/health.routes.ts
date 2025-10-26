import express from "express";
import { healthController } from "./health.controller";

const router = express.Router();

router.get('/', healthController.checkHealth)

export default router;