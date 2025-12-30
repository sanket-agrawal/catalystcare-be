import { authenticate } from "../../../shared/middlewares/authenticatation";
import { authorizeRoles } from "../../../shared/middlewares/rbac";
import express from "express";
import { emailController } from "./email.controller";
import multer from "multer";

const router = express.Router();

router.post('/email-blast',authenticate,authorizeRoles('ADMIN'),multer({ storage: multer.memoryStorage() }).single("file"),emailController.emailBlast)

export default router;