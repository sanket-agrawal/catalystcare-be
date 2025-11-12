import express from 'express';
import { adminController } from './admin.controller';
import { authorizeRoles } from '../../../shared/middlewares/rbac';
import { authenticate } from '../../../shared/middlewares/authenticatation';

const router = express.Router();

router.post('/login',adminController.adminLogin);
router.post('/verify-admin-login-otp',adminController.adminVerifyLoginOtp)
router.get('/therapist-profiles',authenticate, authorizeRoles("ADMIN"),adminController.fetchTherapistProfiles);
router.patch('/therapist-profiles/:profileId/approve-reject',authenticate, authorizeRoles("ADMIN"),adminController.approveRejectTherapistProfile); 

export default router;