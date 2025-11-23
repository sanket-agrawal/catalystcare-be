import express from "express"
import { googleAuthController } from "./googleAuth.controller";
import { authenticate } from "../../../../shared/middlewares/authenticatation";
import { authorizeRoles } from "../../../../shared/middlewares/rbac";

const router = express.Router();

router.get('/calendar',authenticate,authorizeRoles('THERAPIST'),googleAuthController.authenticate);
router.get('/calendar/callback',googleAuthController.callback);

export default router;