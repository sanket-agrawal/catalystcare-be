import express from "express";
// import { aiController } from "./ai.controller";
import ventRoutes from "./vent/index";
import { ensureExtensionAccess } from "../../../shared/middlewares/extensionUser";
import { authenticate } from "../../../shared/middlewares/authenticatation";

const router = express.Router();

router.use(authenticate)
router.use(ensureExtensionAccess)
router.use("/vent",ventRoutes);
// router.post("/vent/voice", aiController.ventVoice);
// router.post("/tools", aiController.runTool);

export default router;
