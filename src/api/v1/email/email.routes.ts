import { authenticate } from "../../../shared/middlewares/authenticatation";
import { authorizeRoles } from "../../../shared/middlewares/rbac";
import express from "express";
import { emailController } from "./email.controller";

const router = express.Router();

router.post('/email-blast',authenticate,authorizeRoles('ADMIN'),emailController.emailBlast)

export default router;