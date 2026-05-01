import express from "express"
import setupRoutes from "./setup/setup.routes"
import { authenticate } from "../../../shared/middlewares/authenticatation";
import { authorizeRoles } from "../../../shared/middlewares/rbac";
import inviteMembersRoutes from "./invite-members/inviteMembers.routes";


const router = express.Router();

router.use('/setup',setupRoutes);
router.use('/invite-members',authenticate,authorizeRoles('ORG_ADMIN'),inviteMembersRoutes);

export default router;