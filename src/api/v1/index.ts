import express from "express";
import userRoutes from "./user/user.routes";
import authRoutes from "./auth/auth.routes";
const router = express.Router();

router.use('/user',userRoutes);
router.use('/auth',authRoutes);

export default router;