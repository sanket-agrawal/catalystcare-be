import express from 'express';
import { adminController } from './admin.controller';
import { authorizeRoles } from '../../../shared/middlewares/rbac';
import { authenticate } from '../../../shared/middlewares/authenticatation';
import { validateRequest } from '../../../shared/middlewares/validate';
import { createCommissionRateSchema } from './admin.dto';
import { fetchAllContactFormSubmissions } from '../../../infrastructure/mongodb/controllers/contact.controller';
import assessmentRoutes from "./assessments/assessment.route"
import testimonialRoutes from "./testimonial/testimonail.routes";

const router = express.Router();

router.post('/login',adminController.adminLogin);
router.post('/verify-admin-login-otp',adminController.adminVerifyLoginOtp)
router.get('/therapist-profiles',authenticate, authorizeRoles("ADMIN"),adminController.fetchTherapistProfiles);
router.patch('/therapist-profiles/:profileId/approve-reject',authenticate, authorizeRoles("ADMIN"),adminController.approveRejectTherapistProfile); 
router.post('/commission-rate/create',authenticate,authorizeRoles('ADMIN'),validateRequest(createCommissionRateSchema),adminController.createComissionRate);
router.get('/commission-rates/all',authenticate,authorizeRoles('ADMIN'),adminController.fetchAllCommissionRate);
router.get('/dashboard',authenticate,authorizeRoles('ADMIN'),adminController.dashboard);
router.get('/billing-dashboard',authenticate,authorizeRoles('ADMIN'),adminController.billingDashboard)
router.get('/therapist/vpa/:therapistId',authenticate,authorizeRoles('ADMIN'),adminController.fetchTherapistVPA);
router.get('/approved-therapist',authenticate,authorizeRoles('ADMIN'),adminController.fetchApprovedTherapist);
router.get('/email-blast-logs',authenticate,authorizeRoles('ADMIN'),adminController.fetchEmailBlastLogs);
router.post('/put-on-hold-therapist',authenticate, authorizeRoles("ADMIN"),adminController.putTherapistProfileOnHold);
router.post('/remove-hold-therapist',authenticate, authorizeRoles("ADMIN"),adminController.removeTherapistProfileHold);
router.get('/contact-form-submissions',authenticate,authorizeRoles('ADMIN'),fetchAllContactFormSubmissions);
router.use('/assessments',authenticate,authorizeRoles('ADMIN'),assessmentRoutes);
router.use('/testimonials',authenticate,authorizeRoles('ADMIN'),testimonialRoutes);


router.get('/program-billings-dashboard',authenticate,authorizeRoles('ADMIN'),adminController.programBillingDashboard);

export default router;