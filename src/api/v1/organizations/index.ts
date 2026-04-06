import express from "express"
import setupRoutes from "./setup/setup.routes"


const router = express.Router();

router.use('/setup',setupRoutes);

export default router;