import express from "express";
import { updateUserProfile, userProfile, extensionDashboard } from "./user.controller";
import { authenticate } from "../../../shared/middlewares/authenticatation";

const router = express.Router();

router.get("/profile", authenticate, userProfile);

router.get("/extension-dashboard", authenticate, extensionDashboard);

router.put("/update-profile", authenticate, updateUserProfile);

export default router;
