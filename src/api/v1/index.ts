import express from "express";
import userRoutes from "./user/user.routes";
import authRoutes from "./auth/auth.routes";
import websiteRoutes from "./website/website.routes";
import therapistRoutes from "./therapist/therapist.routes";
import masterRoutes from "./master-data/index";
import uploadRoutes from "./upload/upload.routes";
const router = express.Router();

router.use('/user',userRoutes);
router.use('/auth',authRoutes);
router.use('/website',websiteRoutes);
router.use('/therapist',therapistRoutes);
router.use('/master-data', masterRoutes);
router.use('/upload', uploadRoutes);

export default router;