import express from "express";
// import { aiController } from "./ai.controller";
import ventRoutes from "./vent/index";

const router = express.Router();

router.use("/vent", ventRoutes);
// router.post("/vent/voice", aiController.ventVoice);
// router.post("/tools", aiController.runTool);

export default router;
